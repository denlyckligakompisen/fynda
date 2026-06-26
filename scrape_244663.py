import sys
import json
import re
import scraper

url = "https://www.booli.se/bostad/244663"
print(f"Fetching {url}...")
# use a large ttl_hours so it just reads from cache
data, cached = scraper.fetch(url, ttl_hours=24)
if data and data.get("html"):
    print("Fetch successful.")
    html = data["html"]
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    if match:
        next_data = json.loads(match.group(1))
        
        # We can extract the Apollo state to see the object
        page_props = next_data.get("props", {}).get("pageProps", {})
        apollo = page_props.get("__APOLLO_STATE__", {})
        
        # save the whole apollo state and the parsed json
        with open("result_244663.json", "w", encoding="utf-8") as f:
            json.dump(next_data, f, indent=2, ensure_ascii=False)
            
        print("Next data saved to result_244663.json")
        
        # let's try to find the listing object
        listing = None
        for k, v in apollo.items():
            if k.startswith("Listing:") or k.startswith("SoldProperty:") or k.startswith("Project:"):
                listing = v
                break
                
        if listing:
            # save just the listing object
            with open("listing_244663.json", "w", encoding="utf-8") as f:
                json.dump(listing, f, indent=2, ensure_ascii=False)
            print("Listing data saved to listing_244663.json")
        else:
            print("No listing object found in Apollo state.")
    else:
        print("Could not find __NEXT_DATA__.")
else:
    print("Fetch failed.")
