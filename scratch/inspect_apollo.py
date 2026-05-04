import json
import re
import os

def resolve(obj, state):
    if isinstance(obj, dict) and "__ref" in obj:
        return resolve(state.get(obj["__ref"]), state)
    if isinstance(obj, list):
        return [resolve(i, state) for i in obj]
    if isinstance(obj, dict):
        return {k: resolve(v, state) for k, v in obj.items()}
    return obj

cache_file = "booli_cache/03bb313b901d148240c40252aabb2b1b00afabe672741e2487e1a507d7e5e431.json"
with open(cache_file, "r", encoding="utf-8") as f:
    data = json.load(f)

html = data["html"]
match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
if match:
    next_data = json.loads(match.group(1))
    apollo = next_data.get("props", {}).get("pageProps", {}).get("__APOLLO_STATE__", {})
    
    print("Apollo keys:")
    for key in sorted(apollo.keys()):
        if not key.startswith("Listing:") and not key.startswith("Image:"):
            print(f"  {key}")

    # Look for Search results
    root = apollo.get("ROOT_QUERY", {})
    print("\nROOT_QUERY search keys:")
    for k in root.keys():
        if "searchForSale" in k:
             val = root[k]
             print(f"\nKey: {k}")
             if isinstance(val, dict):
                 if "__ref" in val:
                     ref = val["__ref"]
                     print(f"  Refers to: {ref}")
                     if ref in apollo:
                         val = apollo[ref]
                 
                 print(f"  Value keys: {list(val.keys())}")
                 for sk, sv in val.items():
                     if isinstance(sv, list) and len(sv) > 0:
                         if isinstance(sv[0], dict) and "__ref" in sv[0]:
                             print(f"    Field '{sk}' has {len(sv)} references (first: {sv[0]['__ref']})")
                         else:
                             print(f"    Field '{sk}' has {len(sv)} items (first: {type(sv[0])})")

