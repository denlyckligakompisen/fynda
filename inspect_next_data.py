import json
from bs4 import BeautifulSoup

with open("debug_booli.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")
script = soup.find("script", {"id": "__NEXT_DATA__"})

if script:
    data = json.loads(script.string)
    print("Keys in props:", data.get("props", {}).keys())
    print("Keys in pageProps:", data.get("props", {}).get("pageProps", {}).keys())
    
    # Try to find listings
    page_props = data.get("props", {}).get("pageProps", {})
    initial_state = page_props.get("initialState", {})
    print("initialState keys:", initial_state.keys())
    
    # Check 'search' in initialState
    search = initial_state.get("search", {})
    print("search keys:", search.keys())
    
    # Check 'searchResult' or similar
    if "result" in search:
        print("Found search.result")
        res = search["result"]
        if hasattr(res, "keys"):
             print("Result keys:", res.keys())
        # It might be a list of IDs or objects
        if isinstance(res, list):
             print(f"Result is list of len {len(res)}")
             if len(res) > 0: print("Sample:", res[0])
        elif isinstance(res, dict):
            # Maybe list is inside
            if "listings" in res:
                listings = res["listings"]
                print(f"Found listings: {len(listings)}")
                if len(listings) > 0:
                     print("Sample listing keys:", listings[0].keys())

    # If Apollo
    apollo = page_props.get("__APOLLO_STATE__", {})
    if apollo:
        print(f"Apollo state keys count: {len(apollo)}")
        # Look for "Listing:..." keys
        listing_keys = [k for k in apollo.keys() if k.startswith("Listing")]
        print(f"Listing keys found: {len(listing_keys)}")
        if len(listing_keys) > 0:
            print("Sample Listing:", apollo[listing_keys[0]])

    
else:
    print("Script tag not found")
