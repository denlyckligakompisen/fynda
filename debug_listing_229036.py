import requests
import json
import re

url = "https://www.booli.se/bostad/229036"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print(f"Fetching {url}...")
resp = requests.get(url, headers=headers)
print(f"Status: {resp.status_code}")

with open("debug_229036.html", "w", encoding="utf-8") as f:
    f.write(resp.text)

# Try to find __NEXT_DATA__ or Apollo state
match = re.search(r'id="__NEXT_DATA__"[^>]*>(.*?)</script>', resp.text, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    with open("debug_229036.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Saved __NEXT_DATA__ to debug_229036.json")

    # Look for listPrice, published, etc.
    props = data.get("props", {}).get("pageProps", {})
    apollo = props.get("apolloState", {})
    
    # Try to find the listing object in Apollo state
    for key, value in apollo.items():
        if "Listing" in key and "229036" in key:
            print(f"\nFound Listing entry: {key}")
            print(json.dumps(value, indent=2, ensure_ascii=False))
        elif "Object" in key and "229036" in key:
             print(f"\nFound Object entry: {key}")
             print(json.dumps(value, indent=2, ensure_ascii=False))

else:
    print("Could not find __NEXT_DATA__")
