import requests
import re
import json
import time
import hashlib
from datetime import datetime
from bs4 import BeautifulSoup

def fetch_kronofogden_listings(start_url):
    print(f"Starting Kronofogden crawl from {start_url}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    session = requests.Session()
    session.headers.update(headers)
    
    all_results = []
    
    current_url = start_url
    page_num = 1
    
    while current_url:
        print(f"Fetching page {page_num}: {current_url}")
        try:
            r = session.get(current_url)
            r.raise_for_status()
            
            soup = BeautifulSoup(r.text, "html.parser")
            hits = soup.select("li.sv-search-hit")
            
            if not hits:
                print("No more hits found.")
                break
                
            print(f"Found {len(hits)} hits on page {page_num}")
            
            for hit in hits:
                item = parse_hit(hit, current_url, session)
                if item:
                    all_results.append(item)
            
            # Find next page
            next_div = soup.select_one("div.next a")
            if next_div:
                href = next_div.get("href")
                base_url = start_url.split("?")[0]
                current_url = base_url + href
                page_num += 1
                time.sleep(1)
            else:
                current_url = None
                
        except Exception as e:
            print(f"Error fetching {current_url}: {e}")
            break
            
    return all_results

def fetch_detail_info(url, session):
    """Fetches details from the individual listing page."""
    try:
        print(f"  Fetching details: {url}")
        r = session.get(url, timeout=15)
        if r.status_code != 200:
            return {}
        
        soup = BeautifulSoup(r.text, "html.parser")
        details = {}
        
        # 1. Extract from Factbox (Fakta)
        # Structure: <h3 class="..." id="h-Adress-0">Adress</h3><p class="normal">Value</p>
        fakta_section = soup.select_one(".factbox-object") or soup.select_one(".factbox")
        if fakta_section:
            headers = fakta_section.select("h3")
            for h in headers:
                label = h.get_text(strip=True).lower()
                value_p = h.find_next_sibling("p")
                if not value_p: continue
                value = value_p.get_text(strip=True)
                
                if "adress" in label:
                    details["address"] = value
                elif "storlek" in label:
                    # "1 rum, 34 kvm"
                    rooms_match = re.search(r'(\d+)\s*rum', value)
                    sqm_match = re.search(r'(\d+)\s*kvm', value)
                    if rooms_match: details["rooms"] = int(rooms_match.group(1))
                    if sqm_match: details["livingArea"] = int(sqm_match.group(1))
                elif "månadsavgift" in label:
                    # "2625:-"
                    fee_val = "".join(filter(str.isdigit, value))
                    if fee_val: details["rent"] = int(fee_val)
                elif "marknadsvärde" in label:
                    # "1800000:-"
                    price_val = "".join(filter(str.isdigit, value))
                    if price_val: 
                        details["listPrice"] = int(price_val)
                        details["estimatedValue"] = int(price_val)

        # 2. Extract Showing Date
        # Look for the Visning app data in script tags
        scripts = soup.find_all("script")
        for script in scripts:
            if "AppRegistry.registerInitialState" in script.text and "showingDate" in script.text:
                try:
                    # showingDate:1770940800000
                    date_match = re.search(r'"showingDate":(\d+)', script.text)
                    if date_match:
                        ts = int(date_match.group(1)) / 1000
                        dt = datetime.fromtimestamp(ts)
                        details["nextShowing"] = {
                            "fullDateAndTime": dt.strftime("%Y-%m-%d %H:%M")
                        }
                except: pass

        # Fallback for showing date from text
        if not details.get("nextShowing"):
            visning_div = soup.find("h2", string=re.compile(r"Visning", re.I))
            if visning_div:
                parent = visning_div.find_parent("div")
                if parent:
                    txt = parent.get_text(" ", strip=True)
                    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', txt)
                    if date_match:
                        details["nextShowing"] = {
                            "fullDateAndTime": f"{date_match.group(1)} 00:00"
                        }
        
        return details
    except Exception as e:
        print(f"  Error fetching details: {e}")
        return {}

def parse_hit(hit, source_page, session):
    try:
        item = {}
        
        # 1. URL & Basic ID
        link = hit.select_one("div.sv-visible-desktop a.h3rubrik") or \
               hit.select_one("div.sv-visible-smallScreens a.h3rubrik") or \
               hit.select_one("div.result-description a.h3rubrik")
            
        if link:
            href = link.get("href")
            item["url"] = "https://auktionstorget.kronofogden.se" + href if href.startswith("/") else href
            match = re.search(r'/(\d+)\.html', href)
            item["booliId"] = f"kfm_{match.group(1)}" if match else f"kfm_{hashlib.md5(href.encode()).hexdigest()[:10]}"
            
            # Image
            img = link.find("img")
            if img:
                src = img.get("src")
                item["imageUrl"] = "https://auktionstorget.kronofogden.se" + src if src.startswith("/") else src
        else:
            return None
            
        # 2. Fetch Detailed Info
        details = fetch_detail_info(item["url"], session)
        item.update(details)
        
        # 3. Fallbacks from Search Hit (if detail fetch failed or missing fields)
        if not item.get("address"):
            text_link = hit.select_one("div.sv-notopmargin.sv-visible-desktop a.h3rubrik")
            if text_link: item["address"] = text_link.get_text(strip=True)
        
        desc_div = hit.select_one("div.result-description")
        if desc_div:
            txt = desc_div.get_text(" ", strip=True)
            if "Uppskattat värde:" in txt and item.get("listPrice") is None:
                val = "".join(filter(str.isdigit, txt.split("Uppskattat värde:")[1].split(":-")[0]))
                try: item["listPrice"] = int(val); item["estimatedValue"] = int(val)
                except: pass
            
            if "Auktion i" in txt:
                match = re.search(r'Auktion i (.+?) (\d{4}-\d{2}-\d{2})', txt)
                if match:
                    item["area"] = match.group(1).strip()
                    item["published"] = match.group(2) + " 00:00:00"
            
            if "Visning:" in txt and not item.get("nextShowing"):
                match = re.search(r'Visning: (\d{4}-\d{2}-\d{2})', txt)
                if match:
                    item["nextShowing"] = {"fullDateAndTime": f"{match.group(1)} 00:00"}

        # 4. Defaults & Formatting
        result = {
            "booliId": None,
            "url": None,
            "address": None,
            "area": "Uppsala", # Default area for Kronofogden tab scope
            "listPrice": None,
            "soldPrice": None,
            "pageViews": 0,
            "daysActive": 0,
            "estimatedValue": None,
            "priceDiff": 0,
            "rooms": None,
            "livingArea": None,
            "rent": None,
            "floor": None,
            "biddingOpen": True, # Kronofogden is always a form of bidding
            "nextShowing": None,
            "published": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "latitude": None,
            "longitude": None,
            "sourcePage": source_page,
            "isSold": False,
            "imageUrl": None,
            "searchSource": "Uppsala (Kronofogden)",
            **item
        }
        
        if result["estimatedValue"] and result["listPrice"]:
            result["priceDiff"] = result["estimatedValue"] - result["listPrice"]
            
        return result
        
    except Exception as e:
        print(f"Error parsing hit: {e}")
        return None

if __name__ == "__main__":
    url = "https://auktionstorget.kronofogden.se/Sokfastigheterbostadsratter.html?sv.url=12.6294450154af3d2b27d64&query=*&100.6294450154af3d2b27d91=03"
    results = fetch_kronofogden_listings(url)
    print(json.dumps(results, indent=2, ensure_ascii=False))
