"""Core scraping logic — fetch sources from API, extract prices, POST results.

Selector strategy (priority order):
  1. cssRule       — `soup.select(cssRule)` (most precise)
  2. fatherClass   — find parent by class, then child by priceClass within it
  3. priceClass    — global `soup.find_all(class_=priceClass)` (fallback)

Multiple matches are NOT an error — they generate a warning and the first
match is used. The user is expected to refine selectors when warnings appear.
"""

import logging
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from config import API_INTERNAL_URL, REQUEST_TIMEOUT, USER_AGENT

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Price text extraction
# ---------------------------------------------------------------------------

def extract_price_text(element) -> Optional[str]:
    """Extract a clean numeric price string from a BeautifulSoup element.

    Handles both US/UK and EU number formats:
      "$1,299.99"  → "1299.99"   (US: dot decimal, comma thousands)
      "1.299,99"   → "1299.99"   (EU: comma decimal, dot thousands)
      "$42.50"     → "42.50"     (no thousands sep)
      "1.299.99"   → "1299.99"   (ambiguous EU thousands, normalize)
      ""           → None
      "no digits"  → None

    Algorithm:
      - Strip everything except digits, dots, commas.
      - If multiple separators exist (mix of dots/commas or >1 of either),
        treat the LAST separator as the decimal point; strip all other
        separators (they were thousands separators).
      - If exactly one separator, treat it as the decimal point.
      - If no separators, the whole string is the integer part.
    """
    if element is None:
        return None

    raw_text = element.get_text(strip=True)
    cleaned = re.sub(r"[^\d.,]", "", raw_text)
    if not cleaned:
        return None

    dot_count = cleaned.count(".")
    comma_count = cleaned.count(",")
    total_seps = dot_count + comma_count

    if total_seps == 0:
        # Pure integer / whole number.
        decimal_str = cleaned
    elif total_seps == 1:
        # Single separator — it IS the decimal point.
        sep = "." if dot_count else ","
        int_part, _, frac_part = cleaned.partition(sep)
        decimal_str = f"{int_part}.{frac_part}" if int_part else f"0.{frac_part}"
    else:
        # Multiple separators: the LAST one (dot or comma) is the decimal.
        # Everything before it (including any other separators) is the
        # integer part with thousands separators that must be stripped.
        last_dot = cleaned.rfind(".")
        last_comma = cleaned.rfind(",")
        last_idx = max(last_dot, last_comma)
        int_part = cleaned[:last_idx]
        frac_part = cleaned[last_idx + 1 :]
        int_clean = int_part.replace(".", "").replace(",", "")
        decimal_str = f"{int_clean}.{frac_part}"

    try:
        float(decimal_str)
    except ValueError:
        return None

    return decimal_str


# ---------------------------------------------------------------------------
# Per-source scraping
# ---------------------------------------------------------------------------

def scrape_source(source: dict) -> dict:
    """Scrape a single source using the 3-strategy selector logic.

    Args:
        source: dict with keys: id, url, priceClass?, cssRule?, fatherClass?

    Returns:
        {
            "sourceId": str,
            "price":    float | None,
            "warning":  str | None,
            "error":    str | None,
        }
    """
    source_id: str = source["id"]
    url: str = source["url"]
    price_class: Optional[str] = source.get("priceClass")
    css_rule: Optional[str] = source.get("cssRule")
    father_class: Optional[str] = source.get("fatherClass")

    result: dict = {
        "sourceId": source_id,
        "price": None,
        "warning": None,
        "error": None,
    }

    # --- Fetch --------------------------------------------------------------
    try:
        headers = {"User-Agent": USER_AGENT}
        response = httpx.get(
            url,
            headers=headers,
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True,
        )
        response.raise_for_status()
    except httpx.TimeoutException:
        result["error"] = f"Request timed out after {REQUEST_TIMEOUT}s"
        logger.warning(f"[{source_id}] Timeout fetching {url}")
        return result
    except httpx.HTTPStatusError as exc:
        result["error"] = f"HTTP {exc.response.status_code} from {url}"
        logger.warning(f"[{source_id}] HTTP {exc.response.status_code} for {url}")
        return result
    except Exception as exc:  # noqa: BLE001 — we want to capture everything
        result["error"] = f"Fetch failed: {exc}"
        logger.exception(f"[{source_id}] Unexpected fetch error for {url}")
        return result

    # --- Parse + select -----------------------------------------------------
    soup = BeautifulSoup(response.text, "lxml")

    elements = []
    strategy = None

    try:
        if css_rule:
            # Strategy 1 — explicit CSS selector.
            strategy = f"cssRule='{css_rule}'"
            elements = soup.select(css_rule)

        elif father_class and price_class:
            # Strategy 2 — locate parent, then descendants with price class.
            strategy = f"father='{father_class}' > child='{price_class}'"
            fathers = soup.find_all(class_=father_class)
            for father in fathers:
                elements.extend(father.find_all(class_=price_class))

        elif price_class:
            # Strategy 3 — global search by class name.
            strategy = f"priceClass='{price_class}'"
            elements = soup.find_all(class_=price_class)

        else:
            result["error"] = (
                "No selector configured (cssRule, fatherClass+priceClass, "
                "or priceClass is required)"
            )
            return result

    except Exception as exc:  # noqa: BLE001
        result["error"] = f"Selector evaluation failed: {exc}"
        logger.exception(f"[{source_id}] Selector error ({strategy})")
        return result

    logger.info(
        f"[{source_id}] Strategy {strategy} → {len(elements)} match(es)"
    )

    # --- Validate count -----------------------------------------------------
    if len(elements) == 0:
        result["error"] = "No elements matched the selector"
        return result

    if len(elements) > 1:
        # Soft warning — first match is used, but user should refine.
        result["warning"] = (
            f"Multiple matches ({len(elements)}) — using first. "
            f"Consider a more specific selector."
        )
        logger.warning(f"[{source_id}] Multiple matches: {len(elements)}")

    # --- Extract price ------------------------------------------------------
    price_text = extract_price_text(elements[0])
    if price_text is None:
        snippet = elements[0].get_text(strip=True)[:80]
        result["error"] = (
            f"Could not extract numeric price from element text: '{snippet}'"
        )
        return result

    try:
        result["price"] = float(price_text)
    except ValueError:
        result["error"] = f"Parsed price '{price_text}' is not a valid float"
        return result

    logger.info(f"[{source_id}] Scraped price: {result['price']}")
    return result


# ---------------------------------------------------------------------------
# API communication
# ---------------------------------------------------------------------------

def post_result(result: dict) -> bool:
    """POST a single scrape result back to the API.

    Only fields with values are included in the payload — the API expects
    exactly one of price/warning/error per source.
    """
    try:
        payload: dict = {"sourceId": result["sourceId"]}
        if result["price"] is not None:
            payload["price"] = result["price"]
        if result["warning"]:
            payload["warning"] = result["warning"]
        if result["error"]:
            payload["error"] = result["error"]

        response = httpx.post(
            f"{API_INTERNAL_URL}/internal/scrape-result",
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        logger.debug(f"[{result['sourceId']}] POST result OK ({response.status_code})")
        return True

    except Exception as exc:  # noqa: BLE001
        logger.error(
            f"Failed to POST result for source {result['sourceId']}: {exc}"
        )
        return False


# ---------------------------------------------------------------------------
# Cycle drivers
# ---------------------------------------------------------------------------

def scrape_all_sources() -> None:
    """Fetch all sources from the API and scrape each one.

    Used by the scheduler for the periodic full-scrape cycle, and by main.py
    for the immediate startup scrape.
    """
    logger.info("Starting scrape cycle...")
    try:
        response = httpx.get(f"{API_INTERNAL_URL}/sources", timeout=10)
        response.raise_for_status()
        sources = response.json().get("sources", [])
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Failed to fetch sources from API: {exc}")
        return

    logger.info(f"Scraping {len(sources)} source(s)...")
    success_count = 0
    for source in sources:
        result = scrape_source(source)
        if post_result(result):
            success_count += 1

    logger.info(
        f"Scrape cycle complete: {success_count}/{len(sources)} results "
        f"posted successfully."
    )


def scrape_specific_sources(source_ids: list[str]) -> None:
    """Scrape only the given source IDs (manual trigger / on-demand).

    Each source is fetched individually from the API, then scraped and
    POSTed back. Failures are isolated — one bad source doesn't block others.
    """
    logger.info(f"Scraping {len(source_ids)} specific source(s): {source_ids}")
    for source_id in source_ids:
        try:
            response = httpx.get(
                f"{API_INTERNAL_URL}/sources/{source_id}", timeout=10
            )
            response.raise_for_status()
            source = response.json().get("source", {})
            if not source:
                logger.warning(f"[{source_id}] Empty source payload — skipping")
                continue

            result = scrape_source(source)
            post_result(result)

        except Exception as exc:  # noqa: BLE001
            logger.error(f"Failed to scrape source {source_id}: {exc}")