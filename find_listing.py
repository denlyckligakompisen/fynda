import json, re, os

cache_dir = "booli_cache"
path = os.path.join(cache_dir, '4ef71824b3c7a4d8161906669a68956cff571619b8bcf12e1b509d8bc5977f49.json')
data = json.load(open(path, "r", encoding="utf-8"))
html = data.get("html", "")

m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
d = json.loads(m.group(1))
apollo = d.get('props', {}).get('pageProps', {}).get('initialApolloState', {})

for k, v in apollo.items():
    if "Listing:" in k:
        booli_id = v.get("booliId")
        if str(booli_id) == "244630":
            print(f"Found listing key: {k}")
            print(json.dumps({k:v for k,v in v.items() if 'show' in k.lower()}, indent=2, ensure_ascii=False))
            print("\nNextShowing:")
            print(v.get("nextShowing"))
            print("\nAll keys:")
            print(list(v.keys()))
            break
