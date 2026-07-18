"""APScheduler setup — periodic full-scrape cycle.

Uses BlockingScheduler because scraper/main.py is a single-purpose worker
container; the scheduler process IS the application process. If a future
change needs non-blocking scheduling (e.g. an HTTP API in the same process),
swap to BackgroundScheduler and start it before calling scheduler.start()
on a separate thread.
"""

import logging

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import SCRAPE_INTERVAL_HOURS
from scraper import scrape_all_sources

logger = logging.getLogger(__name__)


def start_scheduler() -> None:
    """Configure and start the BlockingScheduler.

    Job:    scrape_all_sources
    When:   every SCRAPE_INTERVAL_HOURS (default 8)
    Safety:
      - max_instances=1    prevents overlapping runs
      - replace_existing=True  safe to call add_job twice (e.g. in tests)
      - misfire_grace_time=300s  tolerate a missed fire (container restart,
        long scrape) without immediately re-firing
    """
    scheduler = BlockingScheduler(timezone="UTC")

    scheduler.add_job(
        scrape_all_sources,
        trigger=IntervalTrigger(hours=SCRAPE_INTERVAL_HOURS),
        id="scrape_all",
        name="Full price scrape",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=300,
        # coalesce=True  → if multiple fires were missed, run once not N times
        coalesce=True,
    )

    logger.info(
        f"Scheduler started — scraping every {SCRAPE_INTERVAL_HOURS}h (UTC)"
    )

    # .start() blocks. Caller (main.py) should run any pre-scheduler work
    # BEFORE calling this function.
    scheduler.start()