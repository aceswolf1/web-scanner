# Task Assignment: W4-scraper

**Worker**: worker-scraper
**Role**: pt-general
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Phase**: 3 — Python Scraper

---

## Objective

Build the Python price scraper service. It runs in a Docker container, scrapes product prices from source URLs using CSS selector logic, POSTs results to the Fastify API, and re-runs on an 8-hour schedule.

The `scraper/Dockerfile` and `scraper/requirements.txt` already exist — read them before writing code.

---

## Task IDs

- **T7** = your task. Call `TaskUpdate(taskId: "7", status: "in_progress", owner: "worker-scraper")` immediately.

---

## File Structure

```
scraper/
├── Dockerfile          ← already exists, do not overwrite
├── requirements.txt    ← already exists, expand if needed
├── main.py             ← entry point: starts scheduler + initial scrape
├── scraper.py          ← core scraping logic
├── scheduler.py        ← APScheduler setup
└── config.py           ← env var config
```

---

## Deliverables

### `scraper/config.py`

```python
import os

API_INTERNAL_URL = os.getenv("API_INTERNAL_URL", "http://api:4000")
SCRAPE_INTERVAL_HOURS = int(os.getenv("SCRAPE_INTERVAL_HOURS", "8"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "15"))
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
```

### `scraper/scraper.py`

Core scraping logic — smart selector strategy:

```python
import httpx
from bs4 import BeautifulSoup
import logging
from config import API_INTERNAL_URL, REQUEST_TIMEOUT, USER_AGENT

logger = logging.getLogger(__name__)

def extract_price_text(element) -> str | None:
    """Extract clean price text from a BeautifulSoup element."""
    if element is None:
        return None
    text = element.get_text(strip=True)
    # Remove currency symbols and whitespace, keep digits and decimal separator
    import re
    cleaned = re.sub(r"[^\d.,]", "", text).replace(",", ".")
    # Handle cases like "1.299.99" → take last valid float
    parts = cleaned.split(".")
    if len(parts) > 2:
        cleaned = parts[-2] + "." + parts[-1]
    try:
        float(cleaned)
        return cleaned
    except ValueError:
        return None

def scrape_source(source: dict) -> dict:
    """
    Scrape price from a single source using smart selector strategy.
    
    Strategy (priority order):
    1. cssRule set → use soup.select(cssRule)
    2. fatherClass + priceClass set → find father, then find priceClass within it
    3. priceClass only → soup.find_all(class_=priceClass)
    
    Returns: { sourceId, price, warning, error }
    """
    source_id = source["id"]
    url = source["url"]
    price_class = source.get("priceClass")
    css_rule = source.get("cssRule")
    father_class = source.get("fatherClass")

    result = {"sourceId": source_id, "price": None, "warning": None, "error": None}

    try:
        headers = {"User-Agent": USER_AGENT}
        response = httpx.get(url, headers=headers, timeout=REQUEST_TIMEOUT, follow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")

        elements = []

        if css_rule:
            # Strategy 1: CSS selector rule
            elements = soup.select(css_rule)
            logger.info(f"[{source_id}] CSS rule '{css_rule}': found {len(elements)} elements")
        elif father_class and price_class:
            # Strategy 2: father class → child class
            fathers = soup.find_all(class_=father_class)
            for father in fathers:
                children = father.find_all(class_=price_class)
                elements.extend(children)
            logger.info(f"[{source_id}] Father '{father_class}' > child '{price_class}': found {len(elements)} elements")
        elif price_class:
            # Strategy 3: class name only
            elements = soup.find_all(class_=price_class)
            logger.info(f"[{source_id}] Class '{price_class}': found {len(elements)} elements")
        else:
            result["error"] = "No selector configured (priceClass, cssRule, or fatherClass required)"
            return result

        if len(elements) == 0:
            result["error"] = "No elements matched the selector"
            return result

        if len(elements) > 1:
            result["warning"] = f"Multiple matches ({len(elements)}) — using first. Consider a more specific selector."
            logger.warning(f"[{source_id}] Multiple matches: {len(elements)}")

        price_text = extract_price_text(elements[0])
        if price_text is None:
            result["error"] = f"Could not extract numeric price from element text: '{elements[0].get_text(strip=True)[:50]}'"
            return result

        result["price"] = float(price_text)
        logger.info(f"[{source_id}] Scraped price: {result['price']}")

    except httpx.TimeoutException:
        result["error"] = f"Request timed out after {REQUEST_TIMEOUT}s"
    except httpx.HTTPStatusError as e:
        result["error"] = f"HTTP {e.response.status_code} from {url}"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        logger.exception(f"[{source_id}] Scrape failed")

    return result


def post_result(result: dict) -> bool:
    """POST scrape result back to the API."""
    try:
        payload = {"sourceId": result["sourceId"]}
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
        return True
    except Exception as e:
        logger.error(f"Failed to POST result for source {result['sourceId']}: {e}")
        return False


def scrape_all_sources() -> None:
    """Fetch all sources from the API and scrape each one."""
    logger.info("Starting scrape cycle...")
    try:
        response = httpx.get(f"{API_INTERNAL_URL}/sources", timeout=10)
        response.raise_for_status()
        data = response.json()
        sources = data.get("sources", [])
    except Exception as e:
        logger.error(f"Failed to fetch sources from API: {e}")
        return

    logger.info(f"Scraping {len(sources)} sources...")
    for source in sources:
        result = scrape_source(source)
        post_result(result)

    logger.info("Scrape cycle complete.")


def scrape_specific_sources(source_ids: list[str]) -> None:
    """Scrape only the given source IDs (triggered manually)."""
    logger.info(f"Scraping {len(source_ids)} specific sources: {source_ids}")
    for source_id in source_ids:
        try:
            response = httpx.get(f"{API_INTERNAL_URL}/sources/{source_id}", timeout=10)
            response.raise_for_status()
            source = response.json().get("source", {})
            result = scrape_source(source)
            post_result(result)
        except Exception as e:
            logger.error(f"Failed to scrape source {source_id}: {e}")
```

### `scraper/scheduler.py`

```python
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
from config import SCRAPE_INTERVAL_HOURS
from scraper import scrape_all_sources

logger = logging.getLogger(__name__)


def start_scheduler() -> None:
    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(
        scrape_all_sources,
        trigger=IntervalTrigger(hours=SCRAPE_INTERVAL_HOURS),
        id="scrape_all",
        name="Full price scrape",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=300,
    )
    logger.info(f"Scheduler started — scraping every {SCRAPE_INTERVAL_HOURS}h")
    scheduler.start()
```

### `scraper/main.py`

```python
import logging
import time
import httpx
from config import API_INTERNAL_URL
from scraper import scrape_all_sources
from scheduler import start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def wait_for_api(max_retries: int = 20, delay: int = 5) -> bool:
    """Wait until the API is available before starting."""
    for attempt in range(max_retries):
        try:
            response = httpx.get(f"{API_INTERNAL_URL}/health", timeout=5)
            if response.status_code == 200:
                logger.info("API is ready.")
                return True
        except Exception:
            pass
        logger.info(f"Waiting for API... ({attempt + 1}/{max_retries})")
        time.sleep(delay)
    return False


if __name__ == "__main__":
    logger.info("Scraper starting...")

    if not wait_for_api():
        logger.error("API never became ready — exiting.")
        raise SystemExit(1)

    # Trigger immediate scrape on startup
    logger.info("Running initial scrape...")
    scrape_all_sources()

    # Start 8-hour scheduled scraper (blocks)
    start_scheduler()
```

### Update `scraper/requirements.txt`

Replace with the complete list:

```
requests==2.32.3
httpx==0.27.0
beautifulsoup4==4.12.3
lxml==5.2.2
apscheduler==3.10.4
```

---

## Acceptance Criteria

- [ ] `main.py` waits for API health before starting
- [ ] `main.py` triggers an immediate scrape on startup
- [ ] Scheduler fires every `SCRAPE_INTERVAL_HOURS` (default 8)
- [ ] `scrape_source()` applies the 3-strategy selector logic in priority order
- [ ] Multiple matches trigger a warning (not an error) — first element is used
- [ ] Results POSTed to `POST /internal/scrape-result` per source
- [ ] Errors (timeout, HTTP error, no match) are logged and POSTed with `error` field
- [ ] `config.py` reads all settings from env vars

---

## Reporting

1. Write `development/web-scanner/tasks/W4-scraper/progress-report.md`
2. Write `development/web-scanner/tasks/W4-scraper/completion-report.md`
3. `TaskUpdate(taskId: "7", status: "completed")`
4. Send: `COMPLETE: Python scraper done. main.py + scraper.py + scheduler.py + config.py created.`
