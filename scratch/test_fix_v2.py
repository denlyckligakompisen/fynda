import json
import re
import os
import sys
from bs4 import BeautifulSoup

def resolve(obj, state):
    if isinstance(obj, dict) and "__ref" in obj:
        return resolve(state.get(obj["__ref"]), state)
    if isinstance(obj, list):
        return [resolve(i, state) for i in obj]
    if isinstance(obj, dict):
        return {k: resolve(v, state) for k, v in obj.items()}
    return obj

def test_extract(html, source_page):
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    if not match: return []
    
    data = json.loads(match.group(1))
    page_props = data.get("props", {}).get("pageProps", {})
    apollo = page_props.get("__APOLLO_STATE__", {})
    
    valid_refs = set()
    root = apollo.get("ROOT_QUERY", {})
    for k, v in root.items():
        if k.startswith("searchForSale") or k.startswith("searchSold") or k.startswith("searchNyproduktion"):
            search_data = v
            if isinstance(v, dict) and "__ref" in v:
                search_data = apollo.get(v["__ref"], {})
            
            if isinstance(search_data, dict):
                res = search_data.get("result", [])
                if isinstance(res, list):
                    for r in res:
                        if isinstance(r, dict) and "__ref" in r:
                            valid_refs.add(r["__ref"])

    results = []
    for key in valid_refs:
        item = apollo.get(key)
        if not item: continue
        if key.startswith("Listing:") or key.startswith("SoldProperty:") or key.startswith("Project:"):
            obj = resolve(item, apollo)
            results.append({
                "address": obj.get("streetAddress"),
                "area": obj.get("descriptiveAreaName"),
                "livingArea": obj.get("livingArea", {}).get("raw") if isinstance(obj.get("livingArea"), dict) else obj.get("livingArea")
            })
    return results

cache_file = "booli_cache/03bb313b901d148240c40252aabb2b1b00afabe672741e2487e1a507d7e5e431.json"
with open(cache_file, "r", encoding="utf-8") as f:
    data = json.load(f)

objects = test_extract(data["html"], data["url"])
print(f"Extracted {len(objects)} objects.")
for o in objects[:5]:
    print(f"  - {o['address']} ({o['livingArea']} m2)")

# Check for small objects
small = [o for o in objects if o.get('livingArea') and o['livingArea'] < 30]
print(f"Found {len(small)} objects < 30 m2.")
