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

def extract_objects(html: str, source_page: str):
    # Use robust regex instead of soup.find as script.string can sometimes be None/truncated
    import re
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    
    if not match:
        print(f"Warning: No __NEXT_DATA__ found on {source_page}", file=sys.stderr)
        return []

    try:
        data = json.loads(match.group(1))
        page_props = data.get("props", {}).get("pageProps", {})
        apollo = page_props.get("__APOLLO_STATE__", {})
        
        if not apollo:
            # Try alternative location
            apollo = page_props.get("apolloState", {})
        if not apollo:
            # Try top-level props
            apollo = data.get("props", {}).get("__APOLLO_STATE__", {})
        
        if not apollo:
             print(f"Warning: No Apollo state found in __NEXT_DATA__ on {source_page}", file=sys.stderr)
             return []
        
        results = []
        for key, item in apollo.items():
            if key.startswith("Listing:"):
                # item is the listing object, but might have refs
                obj = resolve(item, apollo)
                
                # URL & ID Logic
                relative_url = obj.get("url")
                booli_id = obj.get("booliId")
                
                if relative_url:
                    url = f"https://www.booli.se{relative_url}"
                    if not booli_id:
                        # try to extract from url /annons/123 or /bostad/123
                        # usually /bostad/123
                        import re
                        match = re.search(r'/(\d+)$', relative_url)
                        if match:
                            booli_id = match.group(1)
                else:
                    # Fallback if url is missing
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

                # Parse Attributes from displayAttributes.dataPoints
                rooms = None
                livingArea = None
                floor = None
                rent = None
                
                # Default values
                page_views = 0
                days_active = 0
                
                # Check top level
                if isinstance(obj.get("pageViews"), int):
                     page_views = obj.get("pageViews")

                # Parse Attributes from displayAttributes.dataPoints (Top Header)
                display_attrs = obj.get("displayAttributes")
                if isinstance(display_attrs, dict):
                    points = display_attrs.get("dataPoints", [])
                    for pt in points:
                         pt = resolve(pt, apollo)
                         val_obj = pt.get("value", {})
                         txt = val_obj.get("plainText", "")
                         lower_txt = txt.lower()
                         
                         if ("rum" in lower_txt or "rok" in lower_txt) and not rooms:
                             # Extract 3.5 from "3,5 rum"
                             match = re.search(r'(\d+(?:[.,]\d+)?)', txt)
                             if match:
                                 try:
                                     rooms = float(match.group(1).replace(",", "."))
                                 except ValueError: pass
                         elif ("m²" in lower_txt or "kvm" in lower_txt or "boarea" in lower_txt or "m2" in lower_txt) and not livingArea:
                             match = re.search(r'(\d+(?:[.,]\d+)?)', txt)
                             if match:
                                 try:
                                     livingArea = float(match.group(1).replace(",", "."))
                                 except ValueError: pass
                         elif (("kr/mån" in lower_txt or "avgift" in lower_txt) and "kr/m²" not in lower_txt and "m2" not in lower_txt) and not rent:
                             # Match patterns like "1 958 kr/mån" - extract number before kr/mån
                             match = re.search(r'([\d\s]+)\s*kr/mån', txt, re.IGNORECASE)
                             if match:
                                 digits = "".join(c for c in match.group(1) if c.isdigit())
                                 if digits:
                                     try:
                                         rent = int(digits)
                                     except ValueError: pass
                             else:
                                 # Fallback: just extract digits if avgift is in text
                                 digits = "".join(c for c in txt if c.isdigit())
                                 if digits and len(digits) <= 5:  # Max 5 digits for reasonable avgift
                                     try:
                                         rent = int(digits)
                                     except ValueError: pass

                # Fallback to direct fields if displayAttributes was missing or incomplete
                if rooms is None:
                    r_obj = obj.get("rooms")
                    if isinstance(r_obj, dict): rooms = r_obj.get("raw")
                    elif isinstance(r_obj, (int, float)): rooms = r_obj
                
                if livingArea is None:
                    la_obj = obj.get("livingArea")
                    if isinstance(la_obj, dict): livingArea = la_obj.get("raw")
                    elif isinstance(la_obj, (int, float)): livingArea = la_obj
                
                if rent is None:
                    re_obj = obj.get("rent")
                    if isinstance(re_obj, dict): rent = re_obj.get("raw")
                    elif isinstance(re_obj, (int, float)): rent = re_obj
                
                if floor is None:
                    fl_obj = obj.get("floor")
                    if isinstance(fl_obj, dict): floor = fl_obj.get("raw")
                    elif isinstance(fl_obj, (int, float)): floor = fl_obj

                
                # Parse InfoSections (Tabs) for PageViews and DaysActive
                # Structure: obj -> infoSections (list) -> "content" -> "infoPoints" (list) -> "key": "pageviews" / "daysActive"
                info_sections = obj.get("infoSections", [])
                if isinstance(info_sections, list):
                    for section in info_sections:
                        section = resolve(section, apollo)
                        content = section.get("content", {})
                        if isinstance(content, dict):
                            points = content.get("infoPoints", [])
                            for pt in points:
                                pt = resolve(pt, apollo)
                                key = pt.get("key")
                                if key == "pageviews":
                                    # displayText: { markdown: "Bostaden har **261** sidvisningar på Booli" }
                                    disp = pt.get("displayText", {})
                                    md = disp.get("markdown", "")
                                    # Extract digits from between ** ** if possible, or just all digits
                                    # Usually format is **123**
                                    match = re.search(r'\*\*([\d\s]+)\*\*', md)
                                    if match:
                                        try:
                                            # remove spaces (e.g. 1 000)
                                            val_str = match.group(1).replace(" ", "").replace("\xa0", "")
                                            page_views = int(val_str)
                                        except ValueError:
                                            pass
                                    elif page_views == 0:
                                        # Fallback: extract all digits
                                        digits = "".join(c for c in md if c.isdigit())
                                        if digits:
                                            page_views = int(digits)
                                
                                elif key == "daysActive":
                                    # displayText: "Bostaden har varit snart till salu i **37** dagar"
                                    disp = pt.get("displayText", {})
                                    md = disp.get("markdown", "")
                                    match = re.search(r'\*\*([\d\s]+)\*\*', md)
                                    if match:
                                        try:
                                            val_str = match.group(1).replace(" ", "").replace("\xa0", "")
                                            days_active = int(val_str)
                                        except ValueError: pass

                # Regex fallback for views if 0
                if not page_views:
                    try:
                        # Search in full text content
                        text_content = soup.get_text()
                        # Match "123 sidvisningar", "1 200 visningar"
                        pv_match = re.search(r'(\d[\d\s\xa0]*)\s*(?:sid)?visningar', text_content, re.IGNORECASE)
                        if pv_match:
                            # Extract all digits from the captured group
                            digits = "".join(filter(str.isdigit, pv_match.group(1)))
                            if digits:
                                page_views = int(digits)
                    except: pass

                # Regex fallback for days if 0
                if not days_active:
                    try:
                        text_content = soup.get_text()
                        da_match = re.search(r'(\d+)\s+dagar', text_content)
                        if da_match:
                            days_active = int(da_match.group(1))
                    except: pass
                
                # Regex fallback for rooms if not found
                if not rooms:
                    try:
                        text_content = soup.get_text()
                        # Match "3 rum", "3.5 rum", "3 rok"
                        rooms_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:rum|rok)', text_content, re.IGNORECASE)
                        if rooms_match:
                            rooms = float(rooms_match.group(1).replace(",", "."))
                    except: pass

                # Regex fallback for livingArea if not found
                if not livingArea:
                    try:
                        text_content = soup.get_text()
                        # Match "65 m²", "65 kvm"
                        area_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:m²|kvm|m2)', text_content, re.IGNORECASE)
                        if area_match:
                            livingArea = float(area_match.group(1).replace(",", "."))
                    except: pass

                # Regex fallback for rent if not found
                if obj.get("rent"):
                    rent = obj.get("rent")
                if not rent:
                    try:
                        text_content = soup.get_text()
                        # Match "4 500 kr/mån", "4500 avgift"
                        rent_match = re.search(r'(\d[\d\s]*)\s*(?:kr/mån|avgift|hyra)', text_content, re.IGNORECASE)
                        if rent_match:
                            digits = "".join(filter(str.isdigit, rent_match.group(1)))
                            if digits:
                                rent = int(digits)
                    except: pass

                # If rent is still an object (FormattedValue from Apollo), extract it
                if isinstance(rent, dict):
                    if "raw" in rent:
                         rent = rent["raw"]
                    elif "value" in rent:
                         digits = "".join(filter(str.isdigit, str(rent["value"])))
                         if digits: rent = int(digits)
                
                # If livingArea is still an object
                if isinstance(livingArea, dict):
                    if "raw" in livingArea:
                         livingArea = livingArea["raw"]
                    elif "value" in livingArea:
                         try: livingArea = float(str(livingArea["value"]).replace(",", "."))
                         except: pass

                # If rooms is still an object
                if isinstance(rooms, dict):
                    if "raw" in rooms:
                         rooms = rooms["raw"]
                    elif "value" in rooms:
                         try: rooms = float(str(rooms["value"]).replace(",", "."))
                         except: pass

                # Check for Sold Status
                is_sold = False
                try:
                    import re
                    text_content = soup.get_text()
                    if "Slutpris" in text_content or re.search(r'Såld eller borttagen', text_content, re.IGNORECASE):
                        is_sold = True
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
                    "isSold": is_sold
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
