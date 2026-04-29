import json
import urllib.request
import re
from bs4 import BeautifulSoup

url = "https://www.booli.se/sok/till-salu?areaIds=386699&maxListPrice=4000000"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
            apollo = data.get("props", {}).get("pageProps", {}).get("__APOLLO_STATE__", {})
            for key, item in apollo.items():
                if key.startswith("Listing:"):
                    print(f"Listing ID: {item.get('booliId')}")
                    print(f"Keys in item: {list(item.keys())}")
                    
                    # Print properties that might contain labels or descriptions
                    for k in ['isNewConstruction', 'labels', 'keywords', 'features']:
                        if k in item:
                            print(f"{k}: {item[k]}")
                    
                    break
except Exception as e:
    print(f"Error: {e}")
