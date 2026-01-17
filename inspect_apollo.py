import json
from bs4 import BeautifulSoup

with open("debug_booli.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
script = soup.find("script", {"id": "__NEXT_DATA__"})

if script:
    data = json.loads(script.string)
    page_props = data.get("props", {}).get("pageProps", {})
    apollo = page_props.get("__APOLLO_STATE__", {})
    
    print(f"Total Apollo keys: {len(apollo)}")
    
    # 1. Find Listing keys
    listings = [k for k in apollo.keys() if k.startswith("Listing:")]
    print(f"Found {len(listings)} Listing keys")
    
    if len(listings) > 0:
        # Resolve the listing fully using helper if I had one, or just dump the raw Apollo key
        # Better: dump the whole apollo state to find the structure
        sample_key = listings[0]
        print(f"Dumping {sample_key} to sample_listing.json")
        with open("sample_listing.json", "w", encoding="utf-8") as out:
            json.dump(apollo[sample_key], out, indent=2, ensure_ascii=False)
        
    # 2. Check ROOT_QUERY for search result
    root = apollo.get("ROOT_QUERY", {})
    print("ROOT_QUERY keys:", root.keys())
    
    # Look for search keys in ROOT_QUERY
    search_keys = [k for k in root.keys() if "search" in k]
    if search_keys:
        print("Search keys in ROOT_QUERY:", search_keys)
        # Check content of first search key
        print("Search content:", root[search_keys[0]])
