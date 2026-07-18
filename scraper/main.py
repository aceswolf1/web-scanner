"""Scraper entry point.

Lifecycle:
  1. Configure logging.
  2. Poll the API `/health` endpoint until it returns 200 (or give up).
  3. Run one full scrape cycle immediately on startup.
  4. Start the BlockingScheduler — blocks for the rest of the container's life.

The immediate scrape (step 3) is intentional: when the container starts (or
restarts), we don't want to wait up to SCRAPE_INTERVAL_HOURS before data is
refreshed. The scheduler still runs on its interval from there on.

Failure modes:
  - API never becomes reachable: exit 1 so Docker restarts us / orchestrator
    notices. The wait_for_api loop has a bounded retry count (20 × 5s = 100s).
  - Individual scrape failures: logged + POSTed to API, do NOT crash the loop.
"""

import logging
import sys
import time

import httpx

from config import API_INTERNAL_URL, LOG_LEVEL
from scheduler import start_scheduler
from scraper import scrape_all_sources

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Startup helpers
# ---------------------------------------------------------------------------

def wait_for_api(max_retries: int = 20, delay_seconds: int = 5) -> bool:
    """Poll the API's /health endpoint until it returns 200.

    Total wait: max_retries * delay_seconds (default: 20 * 5s = 100s).
    Returns True if API became ready, False if we exhausted retries.

    We swallow all exceptions because the API may take time to start its
    own dependencies (DB, MinIO) and we don't want to spam stack traces
    during the startup wait.
    """
    health_url = f"{API_INTERNAL_URL}/health"
    logger.info(f"Waiting for API at {health_url}...")

    for attempt in range(1, max_retries + 1):
        try:
            response = httpx.get(health_url, timeout=5)
            if response.status_code == 200:
                logger.info(f"API is ready (attempt {attempt}).")
                return True
            logger.info(
                f"API responded with {response.status_code} "
                f"(attempt {attempt}/{max_retries})"
            )
        except Exception as exc:  # noqa: BLE001
            # Expected during startup — log at INFO, not WARNING.
            logger.info(
                f"API not ready yet ({exc.__class__.__name__}: {exc}) "
                f"attempt {attempt}/{max_retries}"
            )

        if attempt < max_retries:
            time.sleep(delay_seconds)

    return False


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main() -> int:
    """Run the scraper lifecycle. Returns exit code (0 = clean shutdown)."""
    logger.info("=" * 60)
    logger.info("Scraper starting up")
    logger.info(f"  API_INTERNAL_URL       = {API_INTERNAL_URL}")
    logger.info("=" * 60)

    # 1. Wait for the API to be reachable.
    if not wait_for_api():
        logger.error(
            "API never became ready after retries — exiting so the "
            "orchestrator can restart this container."
        )
        return 1

    # 2. Run an immediate scrape so we have fresh data right away.
    logger.info("Running initial scrape on startup...")
    try:
        scrape_all_sources()
    except Exception:  # noqa: BLE001
        # Individual failures are already handled inside scrape_all_sources;
        # this catches unexpected programmer errors (e.g. import failure).
        logger.exception("Initial scrape raised an unhandled exception")

    # 3. Start the scheduler. This call blocks until the container stops.
    logger.info("Starting scheduler (this blocks)...")
    start_scheduler()

    # start_scheduler() only returns on shutdown.
    logger.info("Scheduler exited — scraper shutting down.")
    return 0


if __name__ == "__main__":
    sys.exit(main())