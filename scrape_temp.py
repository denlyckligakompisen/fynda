import sys
import json
import re
import scraper
import os

url = "https://www.booli.se/bostad/3307835"
print(f"Fetching {url}...")
data, cached = scraper.fetch(url, ttl_hours=24)
if data and data.get("html"):
    print("Fetch successful.")
    html = data["html"]
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    if match:
        next_data = json.loads(match.group(1))
        
        page_props = next_data.get("props", {}).get("pageProps", {})
        apollo = page_props.get("__APOLLO_STATE__", {})
        
        listing = None
        for k, v in apollo.items():
            if k.startswith("Listing:") or k.startswith("SoldProperty:") or k.startswith("Project:"):
                listing = v
                break
                
        if listing:
            print("Listing object found.")
            with open("scraped_3307835.json", "w", encoding="utf-8") as f:
                json.dump(listing, f, indent=2, ensure_ascii=False)
            print("Done")
        else:
            print("No listing object found.")
    else:
        print("Could not find __NEXT_DATA__.")
else:
    print("Fetch failed.")
