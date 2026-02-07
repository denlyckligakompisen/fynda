import requests
import re
import json
import sys

def test_url(url):
    print(f"Testing URL: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        r = requests.get(url, headers=headers, timeout=15)
        print(f"Status: {r.status_code}")
        print(f"HTML length: {len(r.text)}")
        
        # Look for __NEXT_DATA__
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', r.text)
        if match:
            print("Found __NEXT_DATA__")
            data = json.loads(match.group(1))
            page_props = data.get("props", {}).get("pageProps", {})
            apollo = page_props.get("__APOLLO_STATE__", {})
            
            if not apollo:
                 print("Warning: __APOLLO_STATE__ not found in pageProps. Checking top-level...")
                 apollo = data.get("props", {}).get("__APOLLO_STATE__", {})
            
            if not apollo:
                 # Check if it's in a different location
                 print("Keys in pageProps:", page_props.keys())

            objects = []
            for key in apollo.keys():
                 if key.startswith("Listing:") or key.startswith("Sold:"):
                     objects.append(key)
            
            print(f"Total objects found starting with Listing/Sold: {len(objects)}")
            if objects:
                print("First 5 object keys:", objects[:5])
            else:
                print("No Listing/Sold objects found. Printing first 20 keys of Apollo state:")
                print(list(apollo.keys())[:20])
        else:
            print("Could NOT find __NEXT_DATA__")
            # Maybe it's in a different script?
            if "__NEXT_DATA__" in r.text:
                print("__NEXT_DATA__ string is present but regex failed to capture it.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    url = "https://www.booli.se/sok/till-salu?areaIds=35"
    if len(sys.argv) > 1:
        url = sys.argv[1]
    test_url(url)
