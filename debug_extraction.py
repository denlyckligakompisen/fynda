
import json
import re
import sys
import requests
from bs4 import BeautifulSoup

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

def get_headers():
    return {"User-Agent": USER_AGENT}

def resolve(obj, state):
    """Resolve Apollo references recursivly."""
    if isinstance(obj, dict) and "__ref" in obj:
        return resolve(state.get(obj["__ref"]), state)
    if isinstance(obj, list):
        return [resolve(i, state) for i in obj]
    if isinstance(obj, dict):
        return {k: resolve(v, state) for k, v in obj.items()}
    return obj

def debug_extract(url):
    print(f"\n--- Debugging {url} ---")
    try:
        r = requests.get(url, headers=get_headers())
        html = r.text
        print(f"Status: {r.status_code}")
        
        # 1. Regex for __NEXT_DATA__
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if not match:
            print("No __NEXT_DATA__ found")
            return

        data = json.loads(match.group(1))
        page_props = data.get("props", {}).get("pageProps", {})
        apollo = page_props.get("__APOLLO_STATE__", {}) or page_props.get("apolloState", {}) or data.get("props", {}).get("__APOLLO_STATE__", {})
        
        if not apollo:
            print("No Apollo state found")
            return

        # Find the listing object
        listing_obj = None
        for key, item in apollo.items():
            if key.startswith("Listing:") and str(item.get("booliId")) in url: 
                # simplified check, normally we iterate all listings
                # But here we want the MAIN listing for the page.
                # The keys look like "Listing:229274"
                if f"Listing:{url.split('/')[-1]}" in key:
                    listing_obj = resolve(item, apollo)
                    print(f"Found Listing Object: {key}")
                    break
        
        if not listing_obj:
            # Fallback: try to find any Listing object if the ID logic failed
            for key, item in apollo.items():
                if key.startswith("Listing:"):
                    listing_obj = resolve(item, apollo)
                    print(f"Found First Listing Object: {key} (Fallback)")
                    break
        
        if not listing_obj:
            print("No Listing object found in Apollo state")
            # Continue to regex fallback debug
        
        days_active = None
        source = "None"
        
        if listing_obj:
            # Check infoSections
            print("Checking infoSections...")
            info_sections = listing_obj.get("infoSections", [])
            for section in info_sections:
                section = resolve(section, apollo)
                content = section.get("content", {})
                points = content.get("infoPoints", [])
                for pt in points:
                    pt = resolve(pt, apollo)
                    key = pt.get("key")
                    if key == "daysActive":
                        print(f"  Found daysActive key!")
                        disp = pt.get("displayText", {})
                        md = disp.get("markdown", "")
                        print(f"  Markdown: {md}")
                        
                        match = re.search(r'\*\*([\d\s]+)\*\*', md)
                        if match:
                            val_str = match.group(1).replace(" ", "").replace("\xa0", "")
                            days_active = int(val_str)
                            source = "infoSections (bold)"
                            print(f"  Extracted (bold): {days_active}")
                        else:
                            match = re.search(r'i\s+(\d+)\s+dagar', md)
                            if match:
                                days_active = int(match.group(1))
                                source = "infoSections (plain)"
                                print(f"  Extracted (plain): {days_active}")
                            else:
                                raw_val = pt.get("value", {}).get("raw")
                                if isinstance(raw_val, int):
                                    days_active = raw_val
                                    source = "infoSections (raw)"
                                    print(f"  Extracted (raw): {days_active}")

        if days_active is None:
            print("Days Active not found in infoSections. Checking Regex Fallback...")
            soup = BeautifulSoup(html, "html.parser")
            text_content = soup.get_text()
            
            # The regex in scraper.py: r'(\d+)\s+dagar'
            # I will show what it matches
            matches = list(re.finditer(r'(\d+)\s+dagar', text_content))
            print(f"Regex matches found: {len(matches)}")
            for i, m in enumerate(matches[:5]): # show first 5
                print(f"  Match {i}: '{m.group(0)}' -> {m.group(1)}")
            
            if matches:
                 days_active = int(matches[0].group(1))
                 source = "Regex Fallback (First Match)"

        print(f"FINAL DECISION: {days_active} (Source: {source})")

    except Exception as e:
        print(f"Error: {e}")

urls = [
    "https://www.booli.se/bostad/224111",
    "https://www.booli.se/bostad/3898550",
    "https://www.booli.se/bostad/229274"
]

for url in urls:
    debug_extract(url)
