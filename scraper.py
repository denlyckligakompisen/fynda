import os
import sys
import time
import json
import hashlib
import random
import re
import glob
import urllib.parse
from datetime import datetime, timedelta, timezone
from bs4 import BeautifulSoup
from curl_cffi import requests

# =====================
# ANTIGRAVITY CONFIG
# =====================
SEARCH_URLS = [
    {"city": "Uppsala", "url": "https://www.booli.se/sok/till-salu?areaIds=386699,386690,386688,870600&maxListPrice=4000000&minLivingArea=50&upcomingSale="},
    # {"city": "Stockholm", "url": "https://www.booli.se/sok/till-salu?areaIds=115351,141,146,2372,2983,35,568,7300,832568,883816&maxListPrice=4000000&minLivingArea=45&upcomingSale="},
    # {"city": "Uppsala (houses)", "url": "https://www.booli.se/sok/till-salu?areaIds=1116&extendAreas=2&showOnly=tenureOwnership&upcomingSale="},
]

# When True, only the first listing from each search URL is processed (and pagination is skipped).
FIRST_OBJECT_ONLY = False
# When True, detail pages are fetched for all Uppsala apartments (aggressive, may lead to blocks)
ENRICH_APARTMENTS = False

# Environment overrides
DELAY_SECONDS = float(os.getenv("CRAWL_DELAY_SECONDS", "12.0"))
CACHE_TTL_HOURS = int(os.getenv("CACHE_TTL_HOURS", "72"))
CACHE_DIR = os.getenv("CACHE_DIR", "./booli_cache")
SCRAPER_API_KEY = os.getenv("SCRAPER_API_KEY", "")
SCRAPINGBEE_API_KEY = os.getenv("SCRAPINGBEE_API_KEY", "")
ZENROWS_API_KEY = os.getenv("ZENROWS_API_KEY", "")
USE_PLAYWRIGHT = os.getenv("USE_PLAYWRIGHT", "").lower() in ("1", "true", "yes")
PLAYWRIGHT_HEADLESS = os.getenv("PLAYWRIGHT_HEADLESS", "1").lower() in ("1", "true", "yes")

os.makedirs(CACHE_DIR, exist_ok=True)

if SCRAPER_API_KEY:
    print("ScraperAPI key detected — will route requests through ScraperAPI.")
if SCRAPINGBEE_API_KEY:
    print("ScrapingBee key detected — will route requests through ScrapingBee.")
if ZENROWS_API_KEY:
    print("ZenRows key detected — will route requests through ZenRows.")
if USE_PLAYWRIGHT:
    print(f"Playwright mode enabled (headless={PLAYWRIGHT_HEADLESS}).")

# =====================
# CACHE
# =====================
def cache_path(url: str) -> str:
    key = hashlib.sha256(url.encode()).hexdigest()
    return os.path.join(CACHE_DIR, f"{key}.json")

def cache_valid(path: str, ttl_hours: int = None) -> bool:
    if not os.path.exists(path):
        return False
    ttl = ttl_hours if ttl_hours is not None else CACHE_TTL_HOURS
    age = datetime.now() - datetime.fromtimestamp(os.path.getmtime(path))
    return age < timedelta(hours=ttl)

# Curl_cffi global session (optional, but good for connection pooling)
_session = None

def get_session():
    global _session
    if _session is None:
        print("Initializing curl_cffi session...")
        # Prioritize modern and stable Chrome profiles
        profiles = ["chrome124", "chrome120", "chrome116", "safari17_0", "edge101"]
        profile = random.choice(profiles)
        print(f"Using impersonate profile: {profile}")
        
        _session = requests.Session(impersonate=profile, timeout=60)
        
        # Sec-CH-UA headers only for Chrome
        ua_headers = {}
        if profile.startswith("chrome"):
            v = profile.replace("chrome", "")
            ua_headers = {
                "sec-ch-ua": f'"Chromium";v="{v}", "Google Chrome";v="{v}", "Not-A.Brand";v="99"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"'
            }
        
        # Realistic headers for a standard browser
        _session.headers.update({
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7",
            # "Accept-Encoding": "gzip, deflate, br, zstd", # Let curl_cffi handle this
            "Referer": "https://www.google.se/",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1"
        })
        if ua_headers:
            _session.headers.update(ua_headers)
        
        # Visit home page once with random wait (imitating a user)
        try:
            print("Visiting home page to establish session...")
            resp = _session.get("https://www.booli.se/")
            if resp.status_code != 200:
                print(f"Warning: Home page returned status {resp.status_code}", file=sys.stderr)
            time.sleep(random.uniform(4.0, 8.0))
        except Exception as e:
            print(f"Warning: Failed to visit home page: {e}", file=sys.stderr)
            time.sleep(2.0) # Small fallback wait
            
    return _session

def close_browser():
    global _session
    if _session:
        _session.close()
        _session = None
    close_playwright()

# =====================
# PLAYWRIGHT
# =====================
_pw_instance = None
_pw_browser = None
_pw_context = None
_pw_page = None

def get_playwright_page():
    global _pw_instance, _pw_browser, _pw_context, _pw_page
    if _pw_page is not None:
        return _pw_page

    from playwright.sync_api import sync_playwright
    from playwright_stealth import Stealth

    print("Initializing Playwright (stealth)...")
    stealth = Stealth()
    _pw_instance = stealth.use_sync(sync_playwright()).__enter__()
    _pw_browser = _pw_instance.chromium.launch(
        headless=PLAYWRIGHT_HEADLESS,
        args=["--disable-blink-features=AutomationControlled"],
    )
    _pw_context = _pw_browser.new_context(
        locale="sv-SE",
        timezone_id="Europe/Stockholm",
        viewport={"width": 1440, "height": 900},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    )
    _pw_page = _pw_context.new_page()

    # Warm up with home page visit
    try:
        print("Playwright: visiting home page...")
        _pw_page.goto("https://www.booli.se/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(random.uniform(3.0, 5.0))
    except Exception as e:
        print(f"Playwright: home page warmup failed: {e}", file=sys.stderr)

    return _pw_page

def close_playwright():
    global _pw_instance, _pw_browser, _pw_context, _pw_page
    try:
        if _pw_context:
            _pw_context.close()
        if _pw_browser:
            _pw_browser.close()
    except Exception:
        pass
    _pw_context = None
    _pw_browser = None
    _pw_page = None
    _pw_instance = None

def fetch_via_playwright(url: str):
    """Fetch a URL through a stealth Playwright browser."""
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            page = get_playwright_page()
            print(f"Fetching via Playwright: {url} (Attempt {attempt + 1})...")
            resp = page.goto(url, wait_until="domcontentloaded", timeout=45000)
            status = resp.status if resp else 0
            time.sleep(random.uniform(2.0, 4.0))
            html = page.content()

            if any(term in html for term in ["Just a moment", "Attention Required", "Verify you are human", "Checking your browser"]):
                print(f"Playwright: Cloudflare challenge on {url}", file=sys.stderr)
                status = 403

            if status == 200 and "__NEXT_DATA__" in html:
                return html, status

            if attempt < max_retries:
                wait = 8 * (attempt + 1) + random.uniform(2, 6)
                print(f"Playwright: status {status}, retrying in {wait:.1f}s...", file=sys.stderr)
                close_playwright()
                time.sleep(wait)
                continue

            return html if status == 200 else None, status
        except Exception as e:
            print(f"Playwright error ({e}) on {url}", file=sys.stderr)
            if attempt < max_retries:
                close_playwright()
                time.sleep(5 + attempt * 5)
            else:
                return None, 0
    return None, 0

def fetch_via_scraperapi(url: str):
    """Fetch a URL through ScraperAPI (handles Cloudflare automatically)."""
    api_url = "https://api.scraperapi.com"
    params = {
        "api_key": SCRAPER_API_KEY,
        "url": url,
        "render": "false",
        "country_code": "se",
    }
    full_url = f"{api_url}?{urllib.parse.urlencode(params)}"
    
    max_retries = 3
    for attempt in range(max_retries + 1):
        try:
            print(f"Fetching via ScraperAPI: {url} (Attempt {attempt + 1})...")
            response = requests.get(full_url, timeout=90)
            
            if response.status_code == 200:
                return response.text, response.status_code
            
            if response.status_code in (429, 500, 502, 503) and attempt < max_retries:
                wait = 10 * (attempt + 1) + random.uniform(2, 8)
                print(f"ScraperAPI returned {response.status_code}, retrying in {wait:.0f}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            
            print(f"ScraperAPI failed with status {response.status_code} for {url}", file=sys.stderr)
            return None, response.status_code
            
        except Exception as e:
            if attempt < max_retries:
                wait = 10 * (attempt + 1)
                print(f"ScraperAPI request error ({e}), retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
            else:
                print(f"ScraperAPI request failed after {max_retries} retries: {e}", file=sys.stderr)
                return None, 0
    
    return None, 0

def fetch_via_scrapingbee(url: str):
    """Fetch a URL through ScrapingBee."""
    api_url = "https://app.scrapingbee.com/api/v1"
    params = {
        "api_key": SCRAPINGBEE_API_KEY,
        "url": url,
        "render_js": "false",
        "country_code": "se",
    }
    full_url = f"{api_url}?{urllib.parse.urlencode(params)}"
    
    try:
        print(f"Fetching via ScrapingBee: {url}...")
        response = requests.get(full_url, timeout=90)
        if response.status_code == 200:
            return response.text, response.status_code
        print(f"ScrapingBee failed with status {response.status_code} for {url}", file=sys.stderr)
        return None, response.status_code
    except Exception as e:
        print(f"ScrapingBee request error: {e}", file=sys.stderr)
        return None, 0

def fetch_via_zenrows(url: str):
    """Fetch a URL through ZenRows."""
    api_url = "https://api.zenrows.com/v1/"
    params = {
        "apikey": ZENROWS_API_KEY,
        "url": url,
        "premium_proxy": "true",
        "proxy_country": "se",
    }
    full_url = f"{api_url}?{urllib.parse.urlencode(params)}"
    
    try:
        print(f"Fetching via ZenRows: {url}...")
        response = requests.get(full_url, timeout=90)
        if response.status_code == 200:
            return response.text, response.status_code
        print(f"ZenRows failed with status {response.status_code} for {url}", file=sys.stderr)
        return None, response.status_code
    except Exception as e:
        print(f"ZenRows request error: {e}", file=sys.stderr)
        return None, 0


def fetch(url: str, ttl_hours: int = None):
    path = cache_path(url)

    if cache_valid(path, ttl_hours):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f), True

    # === Playwright Path (preferred local) ===
    if USE_PLAYWRIGHT:
        content, status_code = fetch_via_playwright(url)
        if content and status_code == 200:
            data = {
                "url": url,
                "status": status_code,
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
                "html": content
            }
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            time.sleep(random.uniform(2.0, 4.0))
            return data, False
        print(f"Warning: Playwright failed for {url}. Falling through to other strategies.", file=sys.stderr)

    # === Proxy API Path (used in CI) ===
    # Try ZenRows first (most reliable for Cloudflare), then ScrapingBee, then ScraperAPI
    proxy_result = None

    if ZENROWS_API_KEY:
        content, status_code = fetch_via_zenrows(url)
        if content and status_code == 200:
            proxy_result = (content, status_code)
    
    if not proxy_result and SCRAPINGBEE_API_KEY:
        content, status_code = fetch_via_scrapingbee(url)
        if content and status_code == 200:
            proxy_result = (content, status_code)
            
    if not proxy_result and SCRAPER_API_KEY:
        content, status_code = fetch_via_scraperapi(url)
        if content and status_code == 200:
            proxy_result = (content, status_code)
            
    if proxy_result:
        content, status_code = proxy_result
        data = {
            "url": url,
            "status": status_code,
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
            "html": content
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        time.sleep(random.uniform(2.0, 4.0))  # Polite delay
        return data, False

    if SCRAPER_API_KEY or SCRAPINGBEE_API_KEY or ZENROWS_API_KEY:
        print(f"Warning: All proxy services failed for {url}. Falling back to direct fetch.", file=sys.stderr)
    
    # Direct fetch logic follows if ScraperAPI is disabled or failed
    # Retry Logic
    max_retries = 4 # Increased retries
    base_delay = 10
    
    session = get_session()

    for attempt in range(max_retries + 1):
        try:
            print(f"Fetching {url} (Attempt {attempt + 1})...")
            
            # For search navigation, set Referer and correct Sec-Fetch-Site
            resp_headers = {
                "Referer": "https://www.booli.se/",
                "Sec-Fetch-Site": "same-origin"
            }
            if "page=" in url:
                resp_headers["Referer"] = url.split("page=")[0]
                
            response = session.get(url, headers=resp_headers)
            status_code = response.status_code
            content = response.text
            
            # Check for Cloudflare block in content
            if any(term in content for term in ["Just a moment", "Attention Required", "Verify you are human", "Cloudflare", "Access denied", "Checking your browser"]):
                print(f"Cloudflare challenge detected on {url}.", file=sys.stderr)
                status_code = 403

            if status_code == 200:
                data = {
                    "url": url,
                    "status": status_code,
                    "fetchedAt": datetime.now(timezone.utc).isoformat(), # UTC isoformat
                    "html": content
                }

                with open(path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                
                # Jittered delay
                jitter = random.uniform(5.0, 10.0) # Increased jitter
                time.sleep(DELAY_SECONDS + jitter)
                return data, False

            # Handle 403/429/5xx with backoff
            if status_code in (403, 429, 500, 502, 503, 504):
                if attempt < max_retries:
                    wait_time = (base_delay * (2.5 ** attempt)) + random.uniform(5, 15)
                    print(f"Server returned {status_code} for {url}. Retrying in {wait_time:.1f}s...", file=sys.stderr)
                    
                    # If 403, try to refresh the home page to "reset"
                    if status_code in (403, 429):
                        try:
                            # Use a wider variety of profiles, prioritizing newer ones
                            profiles = ["chrome124", "chrome120", "chrome116", "safari17_0", "edge101"]
                            profile = random.choice(profiles)
                            print(f"Creating new session on retry with profile: {profile}", file=sys.stderr)
                            new_session = requests.Session(impersonate=profile, timeout=60)
                            
                            # Re-add headers with same-origin for the home page retry visit
                            new_session.headers.update({
                                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                                "Accept-Language": "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7",
                                "Referer": "https://www.google.se/",
                                "Sec-Fetch-Dest": "document",
                                "Sec-Fetch-Mode": "navigate",
                                "Sec-Fetch-Site": "cross-site",
                                "Sec-Fetch-User": "?1",
                                "Upgrade-Insecure-Requests": "1"
                            })
                            
                            # For Chrome, add CH headers
                            if profile.startswith("chrome"):
                                v = profile.replace("chrome", "")
                                new_session.headers.update({
                                    "sec-ch-ua": f'"Chromium";v="{v}", "Google Chrome";v="{v}", "Not-A.Brand";v="99"',
                                    "sec-ch-ua-mobile": "?0",
                                    "sec-ch-ua-platform": '"Windows"'
                                })
                            
                            resp = new_session.get("https://www.booli.se/")
                            if resp.status_code != 200:
                                print(f"Warning: Session reset home page returned status {resp.status_code}", file=sys.stderr)
                            
                            time.sleep(random.uniform(5.0, 10.0)) # Slightly longer wait
                            global _session
                            _session = new_session 
                            session = new_session
                        except Exception as e:
                            print(f"Failed to reset session: {e}", file=sys.stderr)
                        
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"Failed after {max_retries} retries for {url}. Status: {status_code}", file=sys.stderr)
                    return None, False
            
            return None, False
            
        except Exception as e:
            if attempt < max_retries:
                wait_time = (base_delay * (2 ** attempt)) + random.uniform(0, 2)
                print(f"Request failed ({e}) for {url}. Retrying in {wait_time:.1f}s...", file=sys.stderr)
                time.sleep(wait_time)
            else:
                print(f"Request failed after {max_retries} retries for {url}: {e}", file=sys.stderr)
                return None, False

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
                operatingCost = None
                secondaryArea = None
                plotArea = None
                
                # Default values
                page_views = 0
                days_active = None
                
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
                         elif ("biarea" in lower_txt or "bi-area" in lower_txt) and not secondaryArea:
                             match = re.search(r'(\d+(?:[.,]\d+)?)', txt)
                             if match:
                                 try:
                                     secondaryArea = float(match.group(1).replace(",", "."))
                                 except ValueError: pass
                         elif ("tomt" in lower_txt or "tomtyta" in lower_txt or "tomtarea" in lower_txt) and "m²" in lower_txt:
                             match = re.search(r'([\d\s]+)\s*m²', txt)
                             if match:
                                 digits = "".join(c for c in match.group(1) if c.isdigit())
                                 if digits:
                                     try:
                                         plotArea = int(digits)
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
                         elif ("drift" in lower_txt or "kr/år" in lower_txt) and "kr/m²" not in lower_txt:
                             # Extract drift cost. Often given as "XXXX kr/år"
                             digits = "".join(c for c in txt if c.isdigit())
                             if digits:
                                 try:
                                     val = int(digits)
                                     # If it's a house and we see a large value, it's definitely yearly.
                                     # Typical house operating cost is 20k-60k/year.
                                     if "år" in lower_txt or val > 5000: 
                                         operatingCost = val / 12
                                     else:
                                         operatingCost = val
                                 except ValueError: pass
                         elif ("vån" in lower_txt or " tr" in lower_txt or lower_txt == "bv") and not floor:
                             # Parse floor: "vån 3", "3 tr", "½ tr", "BV" (bottenvåning)
                             if lower_txt == "bv" or "bottenvåning" in lower_txt:
                                 floor = 0
                             else:
                                 match = re.search(r'(\d+(?:[.,]\d+)?)', txt)
                                 if match:
                                     try:
                                         floor = int(float(match.group(1).replace(",", ".")))
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

                if secondaryArea is None:
                    sa_obj = obj.get("additionalArea")
                    if isinstance(sa_obj, dict): secondaryArea = sa_obj.get("raw")
                    elif isinstance(sa_obj, (int, float)): secondaryArea = sa_obj

                if plotArea is None:
                    pa_obj = obj.get("plotArea")
                    if isinstance(pa_obj, dict): plotArea = pa_obj.get("raw")
                    elif isinstance(pa_obj, (int, float)): plotArea = pa_obj

                
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
                                    # Or: "Bostaden har varit till salu i **5** dagar"
                                    disp = pt.get("displayText", {})
                                    md = disp.get("markdown", "")
                                    match = re.search(r'\*\*([\d\s]+)\*\*', md)
                                    if match:
                                        try:
                                            val_str = match.group(1).replace(" ", "").replace("\xa0", "")
                                            days_active = int(val_str)
                                        except ValueError: pass
                                    else:
                                        # Try to match plain text without bolding: "snart till salu i 18 dagar"
                                        match = re.search(r'i\s+(\d+)\s+dagar', md)
                                        if match:
                                            try:
                                                days_active = int(match.group(1))
                                            except ValueError: pass
                                    
                                    # Fallback: check raw value if available
                                    if days_active is None:
                                         raw_val = pt.get("value", {}).get("raw")
                                         if isinstance(raw_val, int):
                                             days_active = raw_val


                # Calculation fallback for daysActive
                if days_active is None and obj.get("published"):
                    try:
                        pub_date = datetime.strptime(obj.get("published"), "%Y-%m-%d %H:%M:%S")
                        days_active = (datetime.now() - pub_date).days
                        # Ensure non-negative
                        if days_active < 0: days_active = 0
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
                # Only mark as sold if:
                # 1. The search URL explicitly targets sold items (/slutpriser)
                # 2. Or if the individual object has a soldPrice confirmed
                is_sold = False
                if "/slutpriser" in source_page.lower():
                    is_sold = True
                elif sp is not None:
                    is_sold = True
                elif obj.get("isSold") is True:
                    is_sold = True

                # Extract image URL
                # The full object is already resolved by `resolve(item, apollo)` above.
                # On search pages: `primaryImage` is a resolved Image dict with an `id`.
                # On detail pages: `images` is a resolved list of Image dicts.
                image_url = None

                # 1. Try primaryImage (present on search result pages)
                primary_img = obj.get("primaryImage")
                if isinstance(primary_img, dict):
                    img_id = primary_img.get("id")
                    if img_id:
                        image_url = f"https://bcdn.se/images/cache/{img_id}_1170x0.jpg"

                # 2. Fallback: images list (present on detail pages)
                if not image_url:
                    images = obj.get("images", [])
                    if isinstance(images, list) and images:
                        first_img = images[0]
                        if isinstance(first_img, dict):
                            img_id = first_img.get("id")
                            if img_id:
                                image_url = f"https://bcdn.se/images/cache/{img_id}_1170x0.jpg"




                # Extract Object Type
                object_type = obj.get("objectType", "Lägenhet")

                # Extract Construction Year
                construction_year = obj.get("constructionYear")
                
                # Extract Apartment Number
                apartment_number = obj.get("apartmentNumber")

                # Try to find in displayAttributes if missing
                if not construction_year or not apartment_number:
                    if isinstance(display_attrs, dict):
                        points = display_attrs.get("dataPoints", [])
                        for pt in points:
                            pt = resolve(pt, apollo)
                            val = pt.get("value", {})
                            txt = val.get("plainText", "")
                            
                            if not construction_year and ("byggår" in pt.get("key", "").lower() or (val.get("suffix") and "år" in val.get("suffix"))):
                                match = re.search(r'(\d{4})', txt)
                                if match:
                                    try: construction_year = int(match.group(1))
                                    except: pass
                
                # Regex fallback for apartment number
                if not apartment_number:
                     try:
                         soup = BeautifulSoup(html, "html.parser")
                         text_content = soup.get_text()
                         lgh_match = re.search(r'(?:lgh|lägenhetsnummer)\s*:?\s*(\d{4})', text_content, re.IGNORECASE)
                         if lgh_match:
                             apartment_number = lgh_match.group(1)
                     except: pass

                # Regex fallback for constructionYear
                if not construction_year:
                    try:
                        soup = BeautifulSoup(html, "html.parser")
                        text_content = soup.get_text()
                        year_match = re.search(r'(?:byggår|byggt)\s*:?\s*(\d{4})', text_content, re.IGNORECASE)
                        if year_match:
                             construction_year = int(year_match.group(1))
                    except: pass

                # Extract Housing Association (BRF)
                brf_name = None
                ha = obj.get("housingAssociation")
                if isinstance(ha, dict):
                    ha = resolve(ha, apollo)
                    brf_name = ha.get("name")
                
                # Fallback: Search for "Brf" or "Förening" in text
                if not brf_name:
                    try:
                        soup = BeautifulSoup(html, "html.parser")
                        text_content = soup.get_text()
                        brf_match = re.search(r'\b(?:Brf|Bostadsrättsföreningen)\s+[A-Za-zåäöÅÄÖ\s\d-]+(?:\b|\.)', text_content, re.IGNORECASE)
                        if brf_match:
                            brf_name = brf_match.group(0).strip().rstrip('.')
                    except: pass

                # Extract Total Floors
                total_floors = None
                # Check floor attribute first if it has structure like "4 av 5"
                # But floor is usually just a number in the API. 
                # Check text content for "våning X av Y" or "X / Y tr"
                try:
                    soup = BeautifulSoup(html, "html.parser")
                    text_content = soup.get_text(" ") # Use space separator to avoid sticking words together
                    
                    # Regex for "våning x av y", "x av y", "x / y tr", "vån x/y"
                    # Capture y (total floors)
                    # Examples: "våning 3 av 5", "3 av 5 tr", "3/5", "vån 3/5"
                    # Be careful not to match dates like "10 av 12" (months?) or random numbers. 
                    # Usually "våning" or "tr" or "av" is the keyword.
                    
                    # Pattern 1: Explicit "våning X av Y" or "vån X av Y"
                    floors_match = re.search(r'(?:våning|vån|plan)\.?\s*-?\d+(?:\s?tr)?\s*(?:av|/)\s*(\d+)', text_content, re.IGNORECASE)
                    
                    if not floors_match:
                         # Pattern 2: "X av Y" where X is small (floors usually < 20)
                         # Risk of false positives, so restrict to nearby "våning" or "hiss"? 
                         # Or just look for "X trappor" context?
                         # Let's try "X av Y" but ensure it looks like a floor info
                         pass
                    
                    if floors_match:
                        total_floors = int(floors_match.group(1))
                except: pass

                # Extract Property Tags (Gavelläge, Eldstad, Hiss, etc.)
                tags = []
                try:
                    soup = BeautifulSoup(html, "html.parser")
                    text_content = soup.get_text()
                    
                    # Mapping of tag labels to regex patterns
                    tag_patterns = {
                        "Gavelläge": r'\bgavelläge\b',
                        "Hörnläge": r'\bhörnläge\b',
                        "Eldstad": r'\b(?:eldstad|kamin|kakelugn|öppen spis)\b',
                        "Hiss": r'\bhiss\b',
                        "Parkering": r'\b(?:parkering|p-plats|garage)\b',
                        "Bastu": r'\bbastu\b',
                        "Inglasad balkong": r'\binglasad balkong\b',
                        "Balkong": r'\bbalkong\b',
                        "Uteplats": r'\buteplats\b',
                        "Sekelskifte": r'\bsekelskifte\b',
                        "Nyproduktion": r'\bnyproduktion\b',
                        "Laddstolpe": r'\b(?:laddstolpe|elbilsladdare)\b',
                        "Toppvåning": r'\b(?:toppvåning|högst upp|översta våningen)\b'
                    }
                    
                    for tag_name, pattern in tag_patterns.items():
                        if re.search(pattern, text_content, re.IGNORECASE):
                            # Special logic for Hiss: ensure it's not "Hiss saknas"
                            if tag_name == "Hiss":
                                if re.search(r'Hiss\s+(?:saknas|finns ej|nej)', text_content, re.IGNORECASE):
                                    continue
                            
                            # Avoid duplicates (Balkong vs Inglasad balkong)
                            if tag_name == "Balkong" and "Inglasad balkong" in tags:
                                continue
                                
                            tags.append(tag_name)
                            
                except: pass
                
                # Extract Energy Class (restoring previous logic)
                energy_class = None
                try:
                    # Reuse text_content if possible but soup might be needed
                    energy_match = re.search(r'(?:energiklass|energideklaration)\s*:?\s*([A-G])\b', text_content, re.IGNORECASE)
                    if energy_match:
                        energy_class = energy_match.group(1).upper()
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
                    "operatingCost": operatingCost if operatingCost is not None else (obj.get("operatingCost", {}).get("raw") / 12 if isinstance(obj.get("operatingCost"), dict) and obj.get("operatingCost", {}).get("raw") else None),
                    "secondaryArea": secondaryArea,
                    "plotArea": plotArea,
                    "floor": floor,
                    "biddingOpen": obj.get("biddingOpen"),
                    "isNew": obj.get("isNew"),
                    "upcomingSale": obj.get("upcomingSale"),
                    "tenure": obj.get("tenure"),
                    "municipality": obj.get("location", {}).get("municipality") if isinstance(obj.get("location"), dict) else None,
                    "county": obj.get("location", {}).get("county") if isinstance(obj.get("location"), dict) else None,
                    "brokerAgency": obj.get("source", {}).get("name") if isinstance(obj.get("source"), dict) else None,
                    "mortgageDeeds": obj.get("mortgageDeeds", {}).get("raw") if isinstance(obj.get("mortgageDeeds"), dict) else None,
                    "nextShowing": obj.get("nextShowing"),
                    "published": obj.get("published"),
                    "latitude": obj.get("latitude"),
                    "longitude": obj.get("longitude"),
                    "sourcePage": source_page,
                    "isSold": is_sold,
                    "imageUrl": image_url,
                    "objectType": object_type,
                    "constructionYear": construction_year,
                    "apartmentNumber": apartment_number,
                    "totalFloors": total_floors,
                    "tags": tags,
                    "brfName": brf_name,
                    "energyClass": energy_class
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
    
    all_objects = []
    pages_crawled = 0
    
    # Track unique IDs to avoid duplicates across searches
    seen_ids = set()

    for search_config in start_urls:
        start_url = search_config["url"]
        city = search_config["city"]
        
        queue = [start_url]
        seen_pages = {start_url}
        
        while queue:
            url = queue.pop(0)
            
            # Graceful delay before fetch
            if pages_crawled > 0:
                d = DELAY_SECONDS * (0.8 + 0.4 * random.random())
                time.sleep(d)

            try:
                page_data, cached = fetch(url)
                if not page_data:
                    print(f"Warning: Fetch returned no data for {url}", file=sys.stderr)
                    continue

                html = page_data.get("html", "")
                
                # Extract objects
                new_objects = extract_objects(html, url)
                if not new_objects:
                    print(f"Warning: No objects extracted from {url}. Status: {page_data.get('status')}. HTML length: {len(html)}")
                    # Log snippet of HTML for debugging if objects missing
                    if len(html) > 0:
                        print(f"HTML snippet: {html[:200]}...")

                first_taken_this_config = False
                print(f"Extracted {len(new_objects)} objects from {url}")
                
                for i, obj in enumerate(new_objects):
                    if obj["booliId"] not in seen_ids:
                        seen_ids.add(obj["booliId"])
                        first_taken_this_config = True
                        
                        if "Toppvåning" in (obj.get("tags") or []) and city == "Uppsala":
                            obj["searchSource"] = f"{city} (top floor)"
                        else:
                            obj["searchSource"] = city

                        # === DETAIL PAGE ENRICHMENT ===
                        is_house = obj.get("objectType") in ["Villa", "Parhus", "Kedjehus", "Radhus"]
                        is_uppsala = "Uppsala" in obj.get("searchSource", "")
                        
                        # We always want detail for houses. 
                        # Apartment enrichment is now optional to stay under rate limits.
                        needs_detail = is_house or (ENRICH_APARTMENTS and is_uppsala and (obj.get("pageViews") == 0 or obj.get("pageViews") is None))
                        
                        if needs_detail:
                            # Graceful delay to avoid blocking
                            # Increase detail page TTL to 30 days (720h) to stay under limits
                            detail_ttl = 720
                            detail_data, cached = fetch(obj["url"], ttl_hours=detail_ttl)
                            
                            if detail_data and not cached:
                                print(f"Fetching detail page for enrichment: {obj['url']}")
                                time.sleep(random.uniform(2.0, 4.0)) 
                            if detail_data:
                                # Re-extract with full detail page HTML
                                enriched = extract_objects(detail_data.get("html", ""), obj["url"])
                                if enriched:
                                    # Find the match in the detail page data (usually just one listing there)
                                    match = next((x for x in enriched if x["booliId"] == obj["booliId"]), enriched[0])
                                    # Update obj with enriched data
                                    for key in ["operatingCost", "plotArea", "secondaryArea", "constructionYear", "energyClass", "hasElevator", "pageViews", "daysActive"]:
                                        if match.get(key) is not None:
                                            obj[key] = match[key]
                        # Final Fallback for Operating Cost if still None
                        if obj.get("operatingCost") is None:
                            la = obj.get("livingArea")
                            ot = obj.get("objectType")
                            if la:
                                if ot in ["Villa", "Parhus", "Kedjehus", "Radhus"]:
                                    obj["operatingCost"] = 200 * la / 12
                                else:
                                    obj["operatingCost"] = 50 * la / 12
                            else:
                                obj["operatingCost"] = 0

                        if needs_detail:
                            print(f"  -> Enriched {obj['address']}: Drift {(obj.get('operatingCost') or 0):.0f} kr/mån, Tomt {obj.get('plotArea', 'N/A')} m²")

                        all_objects.append(obj)
                
                pages_crawled += 1
                
                # Find next pages
                new_pages = find_pages(html)
                for p in new_pages:
                    if p not in seen_pages:
                        seen_pages.add(p)
                        queue.append(p)

                print(f"Processed {url} - found {len(new_objects)} objects, {len(new_pages)} new pages.")

            except Exception as e:
                print(f"Failed to process {url}: {e}", file=sys.stderr)

    print(f"\nCrawl complete. Found {len(all_objects)} unique objects across {pages_crawled} pages.")

    # Cleanup browser
    close_browser()

    return {
        "meta": {
            "crawledAt": datetime.now(timezone.utc).isoformat(),
            "pagesCrawled": pages_crawled,
            "objectsFound": len(all_objects),
            "cacheHitRatio": 0 
        },
        "objects": sorted(
            all_objects,
            key=lambda o: (o["priceDiff"] if o["priceDiff"] is not None else -10**9),
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
        urls_to_use = SEARCH_URLS
        if args.url:
             # If manual URL passed, we don't know the city, default to Uppsala or 'Manual'
             urls_to_use = [{"city": "Manual", "url": args.url}]
             
        result = run(start_urls=urls_to_use)
        
        # Validate result before saving
        if not result or not result.get("objects"):
            raise RuntimeError("Crawl yielded no objects. Not overwriting previous snapshot.")

        # 1. Save to snapshots directory (cleanup first)
        snapshot_dir = "snapshots"
        os.makedirs(snapshot_dir, exist_ok=True)
        
        # Delete old snapshots (keep only latest successful)
        for old_file in glob.glob(os.path.join(snapshot_dir, "*.json")):
            try:
                os.remove(old_file)
            except: pass

        date_str = datetime.now().strftime("%Y-%m-%d")
        snapshot_path = os.path.join(snapshot_dir, f"{date_str}.json")
        
        with open(snapshot_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        # 2. Save to specified output (e.g. booli_daily_snapshot.json)
        # Using a temp file + rename for atomicity
        temp_output = args.output + ".tmp"
        with open(temp_output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        if os.path.exists(args.output):
            os.remove(args.output)
        os.rename(temp_output, args.output)

        print(f"Successfully saved latest snapshot to {args.output} and {snapshot_path}")
        sys.exit(0)

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during crawl: {e}. Keeping existing successful snapshots.", file=sys.stderr)
        sys.exit(1)
