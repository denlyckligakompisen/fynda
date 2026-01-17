import os
import sys
import time
import json
import hashlib
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# =====================
# ANTIGRAVITY CONFIG
# =====================
START_URL = os.getenv(
    "START_URL",
    "https://www.booli.se/sok/till-salu"
    "?areaIds=115355,35,883816,3377,2983,115351,874646,874654"
    "&floor=topFloor"
    "&maxListPrice=4000000"
    "&minLivingArea=45"
    "&upcomingSale="
)

DELAY_SECONDS = float(os.getenv("CRAWL_DELAY_SECONDS", "4.5"))
CACHE_TTL_HOURS = int(os.getenv("CACHE_TTL_HOURS", "24"))
CACHE_DIR = os.getenv("CACHE_DIR", "./booli_cache")

USER_AGENT = os.getenv(
    "USER_AGENT",
    "AntigravityCrawler/1.0 (daily; contact=you@example.com)"
)

HEADERS = {"User-Agent": USER_AGENT}

os.makedirs(CACHE_DIR, exist_ok=True)

# =====================
# CACHE
# =====================
def cache_path(url: str) -> str:
    key = hashlib.sha256(url.encode()).hexdigest()
    return os.path.join(CACHE_DIR, f"{key}.json")

def cache_valid(path: str) -> bool:
    if not os.path.exists(path):
        return False
    age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(path))
    return age < timedelta(hours=CACHE_TTL_HOURS)

def fetch(url: str):
    path = cache_path(url)

    if cache_valid(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f), True

    r = requests.get(url, headers=HEADERS, timeout=20)

    if r.status_code in (429, 403):
        raise RuntimeError(f"Blocked or rate limited ({r.status_code})")

    data = {
        "url": url,
        "status": r.status_code,
        "fetchedAt": datetime.utcnow().isoformat(),
        "html": r.text
    }

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    time.sleep(DELAY_SECONDS)
    return data, False

# =====================
# PARSING
# =====================
def to_int(value):
    if not value:
        return None
    digits = "".join(c for c in value if c.isdigit())
    return int(digits) if digits else None

def extract_objects(html: str, source_page: str):
    soup = BeautifulSoup(html, "html.parser")
    results = []

    for card in soup.select("article"):
        link = card.find("a", href=True)
        if not link:
            continue

        url = "https://www.booli.se" + link["href"]

        def txt(sel):
            el = card.select_one(sel)
            return el.get_text(strip=True) if el else None

        lp = to_int(txt("[data-testid='list-price']"))
        ev = to_int(txt("[data-testid='valuation']"))

        results.append({
            "url": url,
            "address": txt("[data-testid='address']"),
            "area": txt("[data-testid='area']"),
            "listPrice": lp,
            "estimatedValue": ev,
            "priceDiff": ev - lp if ev and lp else None,
            "rooms": to_int(txt("[data-testid='rooms']")),
            "livingArea": to_int(txt("[data-testid='living-area']")),
            "floor": txt("[data-testid='floor']"),
            "sourcePage": source_page
        })

    return results

def find_pages(html: str):
    soup = BeautifulSoup(html, "html.parser")
    pages = set()

    for a in soup.select("a[href*='page=']"):
        href = a.get("href")
        if href and href.startswith("/sok/till-salu"):
            pages.add("https://www.booli.se" + href)

    return sorted(pages)

# =====================
# MAIN CRAWL
# =====================
def run():
    queue = [START_URL]
    seen = set(queue)

    objects = []
    pages_crawled = 0
    cache_hits = 0

    while queue:
        url = queue.pop(0)
        page, cached = fetch(url)

        pages_crawled += 1
        if cached:
            cache_hits += 1

        html = page.get("html", "")
        objects.extend(extract_objects(html, url))

        for p in find_pages(html):
            if p not in seen:
                seen.add(p)
                queue.append(p)

    return {
        "meta": {
            "source": "booli.se",
            "runType": "daily",
            "crawledAt": datetime.utcnow().isoformat(),
            "pagesCrawled": pages_crawled,
            "objectsFound": len(objects),
            "cacheHitRatio": round(cache_hits / pages_crawled, 2) if pages_crawled else 0
        },
        "objects": sorted(
            objects,
            key=lambda o: (o["priceDiff"] or -10**9),
            reverse=True
        ),
        "errors": []
    }

# =====================
# ENTRY
# =====================
if __name__ == "__main__":
    try:
        result = run()
        json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
        sys.exit(0)
    except Exception as e:
        error = {
            "meta": {
                "runType": "daily",
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        json.dump(error, sys.stdout, ensure_ascii=False, indent=2)
        sys.exit(1)
