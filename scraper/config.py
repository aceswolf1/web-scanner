"""Environment-driven configuration for the scraper service.

All settings come from environment variables, with safe defaults so the
container runs out-of-the-box in development.
"""

import os

# API service reachable inside the Docker network.
# In dev: docker-compose maps this to the api service.
# In prod: inject via compose / k8s env.
API_INTERNAL_URL: str = os.getenv("API_INTERNAL_URL", "http://api:4000")

# How often to run a full scrape cycle.
# Default 8h = 3 scrapes per day per source.
SCRAPE_INTERVAL_HOURS: int = int(os.getenv("SCRAPE_INTERVAL_HOURS", "8"))

# Per-request HTTP timeout (seconds). 15s is a reasonable balance:
# fast enough to fail over slow sites quickly, long enough for heavy pages.
REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "15"))

# Modern Chrome user agent — most sites render content for it and won't
# serve a stripped/blocked version.
USER_AGENT: str = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# Logging level — INFO for normal operation, DEBUG for selector tracing.
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()