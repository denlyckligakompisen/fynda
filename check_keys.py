import json, re, os

cache_dir = "booli_cache"
f = os.listdir(cache_dir)[0]
path = os.path.join(cache_dir, f)
data = json.load(open(path, "r", encoding="utf-8"))
html = data.get("html", "")

m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
if m:
    try:
        d = json.loads(m.group(1))
        apollo = d.get('props', {}).get('pageProps', {}).get('initialApolloState', {})
        listing_keys = [k for k in apollo if k.startswith("Listing:")]
        if listing_keys:
            first = apollo[listing_keys[0]]
            showings = {k: v for k, v in first.items() if "show" in k.lower()}
            print("Showing fields in Listing:")
            print(json.dumps(showings, indent=2, ensure_ascii=False))
            print("\nNext showing object:")
            print(json.dumps(first.get("nextShowing"), indent=2, ensure_ascii=False))
            print("\nAll keys:")
            print(list(first.keys()))
    except Exception as e:
        print("Error:", e)
else:
    print("No next data found")
