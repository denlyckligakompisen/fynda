import os
import sys
import time
import json
import hashlib
import random
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

def extract_objects(html: str, source_page: str):
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", {"id": "__NEXT_DATA__"})
    
    if not script:
        # Fallback to old method or just log warning
        print(f"Warning: No __NEXT_DATA__ found on {source_page}", file=sys.stderr)
        return []

    try:
        data = json.loads(script.string)
        apollo = data.get("props", {}).get("pageProps", {}).get("__APOLLO_STATE__", {})
        
        results = []
        for key, item in apollo.items():
            if key.startswith("Listing:"):
                # item is the listing object, but might have refs
                obj = resolve(item, apollo)
                
                # URL Logic
                # Use the URL provided in the object, usually /annons/... or /bostad/...
                relative_url = obj.get("url")
                if relative_url:
                    url = f"https://www.booli.se{relative_url}"
                else:
                    # Fallback if url is missing
                    booli_id = obj.get("booliId")
                    if not booli_id: continue
                    url = f"https://www.booli.se/bostad/{booli_id}"
                
                # Area Logic
                # 'descriptiveAreaName' seems to be the area
                area = obj.get("descriptiveAreaName", "")
                
                # List Price
                lp_obj = obj.get("listPrice")
                lp = None
                if isinstance(lp_obj, dict):
                    lp = lp_obj.get("raw")
                elif isinstance(lp_obj, (int, float)):
                    lp = lp_obj

                # Estimated Value
                # Found in estimate.price.raw
                ev = None
                estimate = obj.get("estimate")
                if isinstance(estimate, dict):
                    price_obj = estimate.get("price")
                    if isinstance(price_obj, dict):
                        ev = price_obj.get("raw")

                # Sold Price
                sp = None
                sp_obj = obj.get("soldPrice")
                if isinstance(sp_obj, dict):
                    sp = sp_obj.get("raw")
                elif isinstance(sp_obj, (int, float)):
                    sp = sp_obj

                # Page Views
                # Usually pageViews is a top level field in the Listing object
                page_views = obj.get("pageViews")
                if not isinstance(page_views, int):
                    page_views = 0

                # Parse Attributes from displayAttributes.dataPoints
                rooms = None
                livingArea = None
                floor = None
                
                display_attrs = obj.get("displayAttributes")
                if isinstance(display_attrs, dict):
                    points = display_attrs.get("dataPoints", [])
                    # Resolve points if they are refs (though usually nested objects in this view)
                    # But 'resolve' function handles lists of dicts too if they have refs inside? No, my resolve is generic.
                    # Let's assume they are resolved or dicts.
                    for pt in points:
                         pt = resolve(pt, apollo)
                         val_obj = pt.get("value", {})
                         txt = val_obj.get("plainText", "")
                         
                         txt = val_obj.get("plainText", "")
                         
                         lower_txt = txt.lower()
                         
                         if ("rum" in lower_txt or "rok" in lower_txt) and not rooms:
                             # "2 rum", "2 rok"
                             digits = "".join(c for c in txt if c.isdigit() or c == '.' or c == ',')
                             if digits:
                                 try:
                                     rooms = float(digits.replace(",", "."))
                                 except ValueError:
                                     pass
                         elif ("m²" in lower_txt or "kvm" in lower_txt or "boarea" in lower_txt or "m2" in lower_txt) and not livingArea:
                             # "49,3 m²", "49 m2", "Boarea 49 kvm"
                             import re
                             # Match number possibly followed by space/m2
                             match = re.search(r'(\d+(?:[.,]\d+)?)', txt)
                             if match:
                                 try:
                                     livingArea = float(match.group(1).replace(",", "."))
                                 except ValueError:
                                     pass
                         elif ("kr/mån" in lower_txt or "avgift" in lower_txt or "hyra" in lower_txt) and "rent" not in obj:
                             # "3 450 kr/mån", "Avgift 3450 kr"
                             digits = "".join(c for c in txt if c.isdigit())
                             if digits:
                                 try:
                                     obj["rent"] = int(digits)
                                 except ValueError:
                                     pass

                results.append({
                    "url": url,
                    "address": obj.get("streetAddress"),
                    "area": area,
                    "listPrice": lp,
                    "soldPrice": sp,
                    "pageViews": page_views,
                    "estimatedValue": ev,
                    "priceDiff": (ev - lp) if (ev is not None and lp is not None) else None,
                    "rooms": rooms,
                    "livingArea": livingArea,
                    "rent": obj.get("rent"),
                    "floor": floor,
                    "biddingOpen": obj.get("biddingOpen"),
                    "nextShowing": obj.get("nextShowing"),
                    "published": obj.get("published"),
                    "latitude": obj.get("latitude"),
                    "longitude": obj.get("longitude"),
                    "sourcePage": source_page
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
def run(start_url=START_URL):
    queue = [start_url]
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
    import argparse
    
    parser = argparse.ArgumentParser(description="Booli Crawler")
    parser.add_argument("--url", default=START_URL, help="Start URL for crawling")
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
        
        result = run(start_url=args.url)
        
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
