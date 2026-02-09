import os
import sys
import time
import json
import hashlib
import random
import re
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# =====================
# ANTIGRAVITY CONFIG
# =====================
SEARCH_URLS = [
    # Stockholm (Top Floor)
    "https://www.booli.se/sok/till-salu?areaIds=115351,115355,2983,35,883816&floor=topFloor&maxListPrice=4000000&minLivingArea=45&upcomingSale=",
    # Stockholm (General)
    "https://www.booli.se/sok/till-salu?areaIds=115351,115355,2983,35,883816&maxListPrice=4000000&minLivingArea=45&upcomingSale=",
    # Uppsala (General)
    "https://www.booli.se/sok/till-salu?areaIds=386699,386690,386688,870600&maxListPrice=4000000&minLivingArea=50&upcomingSale=",
    # Uppsala (Top Floor)
    "https://www.booli.se/sok/till-salu?areaIds=386699,386690,386688,870600&floor=topFloor&maxListPrice=4000000&minLivingArea=50&upcomingSale="
]

DELAY_SECONDS = float(os.getenv("CRAWL_DELAY_SECONDS", "4.5"))
CACHE_TTL_HOURS = int(os.getenv("CACHE_TTL_HOURS", "24"))
CACHE_DIR = os.getenv("CACHE_DIR", "./booli_cache")

USER_AGENT = os.getenv(
    "USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
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

    # Retry Logic with Exponential Backoff
    max_retries = 3
    base_delay = 5
    
    for attempt in range(max_retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            
            if r.status_code == 200:
                data = {
                    "url": url,
                    "status": r.status_code,
                    "fetchedAt": datetime.utcnow().isoformat(),
                    "html": r.text
                }

                with open(path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                
                # Jittered delay between successful requests
                jitter = random.uniform(0.5, 1.5)
                time.sleep(DELAY_SECONDS + jitter)
                return data, False

            # Handle 429/5xx with backoff
            if r.status_code in (429, 500, 502, 503, 504):
                if attempt < max_retries:
                    wait_time = (base_delay * (2 ** attempt)) + random.uniform(0, 2)
                    print(f"Server returned {r.status_code}. Retrying in {wait_time:.1f}s...", file=sys.stderr)
                    time.sleep(wait_time)
                    continue
                else:
                    raise RuntimeError(f"Failed after {max_retries} retries. Status: {r.status_code}")
            
            # Other errors (403, 404, etc) - fail immediately
            r.raise_for_status()
            
        except requests.RequestException as e:
            if attempt < max_retries:
                wait_time = (base_delay * (2 ** attempt)) + random.uniform(0, 2)
                print(f"Request failed ({e}). Retrying in {wait_time:.1f}s...", file=sys.stderr)
                time.sleep(wait_time)
            else:
                raise RuntimeError(f"Request failed after {max_retries} retries: {e}")

    return None, False

# =====================
# PARSING
# =====================
def resolve(obj, state):
    """Resolve Apollo references recursivly."""
    if isinstance(obj, dict) and "__ref" in obj:
        return resolve(state.get(obj["__ref"]), state)
    if isinstance(obj, list):
        return [resolve(i, state) for i in obj]
    if isinstance(obj, dict):
        return {k: resolve(v, state) for k, v in obj.items()}
    return obj

                 if isinstance(first_img, dict):
                     img_id = first_img.get("id")
                     if img_id:
                         # Use 1170x0 as a good default for listing cards
                         image_url = f"https://bcdn.se/images/cache/{img_id}_1170x0.jpg"

                # Calculate daysActive if missing, based on published date
                if not days_active and obj.get("published"):
                    try:
                        pub_date = datetime.strptime(obj.get("published"), "%Y-%m-%d %H:%M:%S")
                        days_active = (datetime.now() - pub_date).days
                        if days_active < 0: days_active = 0
                    except: pass

                results.append({
                    "booliId": booli_id,
                    "url": url,
                    "address": obj.get("streetAddress"),
                    "area": area,
                    "listPrice": lp,
                    "soldPrice": sp,
                    "pageViews": page_views,
                    "daysActive": days_active,
                    "estimatedValue": ev,
                    "priceDiff": (ev - lp) if (ev is not None and lp is not None) else None,
                    "rooms": rooms,
                    "livingArea": livingArea,
                    "rent": rent,
                    "floor": floor,
                    "biddingOpen": obj.get("biddingOpen"),
                    "nextShowing": obj.get("nextShowing"),
                    "published": obj.get("published"),
                    "latitude": obj.get("latitude"),
                    "longitude": obj.get("longitude"),
                    "sourcePage": source_page,
                    "isSold": is_sold,
                    "imageUrl": image_url
                })
        
        return results
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error parsing JSON on {source_page}: {e}", file=sys.stderr)
        return []

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
def run(start_urls=SEARCH_URLS):
    print(f"Starting crawl of {len(start_urls)} search configs...")
    
    queue = list(start_urls)
    seen = set(queue)
    
    all_objects = []
    pages_crawled = 0
    
    # Track unique IDs to avoid duplicates across searches
    seen_ids = set()

    while queue:
        url = queue.pop(0)
        # Graceful delay before fetch
        if pages_crawled > 0:
            d = DELAY_SECONDS * (0.8 + 0.4 * random.random())
            time.sleep(d)

        try:
            page_data, cached = fetch(url)
            html = page_data.get("html", "")
            
            # Extract objects
            new_objects = extract_objects(html, url)
            for obj in new_objects:
                if obj["booliId"] not in seen_ids:
                    seen_ids.add(obj["booliId"])
                    
                    if "floor=topFloor" in url:
                        base = "Stockholm" if "883816" in url else "Uppsala" # Auto-detect city by area ID presence or url string
                        # Since Uppsala has areaIds=386699..., and Stockholm has 115355...
                        # Easier: Just check areaIds or specific unique IDs
                        
                        if "386699" in url:
                             obj["searchSource"] = "Uppsala (top floor)"
                        else:
                             obj["searchSource"] = "Stockholm (top floor)"
                             
                    elif "386699" in url: # Uppsala Area ID
                        obj["searchSource"] = "Uppsala"
                    else:
                        obj["searchSource"] = "Stockholm"
                    
                    all_objects.append(obj)
            
            pages_crawled += 1
            
            # Find next pages
            new_pages = find_pages(html)
            for p in new_pages:
                if p not in seen:
                    seen.add(p)
                    queue.append(p)
                    
            print(f"Processed {url} - found {len(new_objects)} objects, {len(new_pages)} new pages.")

        except Exception as e:
            print(f"Failed to process {url}: {e}", file=sys.stderr)

    print(f"\nCrawl complete. Found {len(all_objects)} unique objects across {pages_crawled} pages.")

    return {
        "meta": {
            "crawledAt": datetime.utcnow().isoformat(),
            "pagesCrawled": pages_crawled,
            "objectsFound": len(all_objects),
            "cacheHitRatio": 0 
        },
        "objects": sorted(
            all_objects,
            key=lambda o: (o["priceDiff"] or -10**9),
            reverse=True
        ),
        "errors": []
    }

# =====================
# ENTRY
# =====================
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Booli Crawler")
    parser.add_argument("--url", default=None, help="Start URL for crawling (optional override)")
    parser.add_argument("--output", default="booli_daily_snapshot.json", help="Output JSON file")
    
    args = parser.parse_args()
    
    # Override global START_URL for the run function logic (or pass it in)
    # Better: refactor run() to accept url.
    # For now, I'll monkeypatch or just change run() signature.
    
    # Let's verify run() signature change needs.
    # run() currently reads global START_URL. Refactoring run() is safer.
    
    try:
        # We need to pass args to run, so I'll change run() locally here to use args.url if I can, 
        # or better, update run() definition in next step.
        # But wait, I can modify the global variable here before calling run() if run() uses the global.
        # START_URL is defined at module level.
        # START_URL = args.url # This line is commented out in the provided snippet, and run() is called with an argument.
        
        # Actually, let's just refactor run() to take arguments in the next step, 
        # but for this specific tool call, I'm replacing the entry block.
        # I will assume run() uses the global START_URL. I will update it in a separate call or just assign it here.
        # The 'run' function uses 'START_URL'.
        
        # args.url is a single string, but run expects a list now if we want to override.
        # If user provides --url, we wrap it in a list.
        urls_to_use = [args.url] if args.url else SEARCH_URLS
        if args.url:
             urls_to_use = [args.url]

        result = run(start_urls=urls_to_use)
        
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        sys.exit(0)
    except Exception as e:
        import traceback
        traceback.print_exc()
        error = {
            "meta": {
                "runType": "daily",
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(error, f, ensure_ascii=False, indent=2)
        sys.exit(1)
