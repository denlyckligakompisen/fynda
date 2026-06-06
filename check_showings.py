import json, re, os

# Find cache file for search page
cache_dir = "booli_cache"
for f in os.listdir(cache_dir):
    path = os.path.join(cache_dir, f)
    data = json.load(open(path, "r", encoding="utf-8"))
    html = data.get("html", "")
    
    m = re.search(r'__APOLLO_STATE__\s*=\s*({.*?});\s*</script>', html, re.DOTALL)
    if not m:
        continue
    
    apollo = json.loads(m.group(1))
    
    # Find all keys with "Showing" in them
    showing_keys = [k for k in apollo if "Showing" in k or "showing" in k.lower()]
    print(f"File: {f}")
    print(f"  Showing-related Apollo keys ({len(showing_keys)}):")
    for k in showing_keys[:10]:
        print(f"    {k}: {json.dumps(apollo[k], ensure_ascii=False)[:200]}")
    
    # Check first listing for showing-related fields
    listing_keys = [k for k in apollo if k.startswith("Listing:")]
    if listing_keys:
        first = apollo[listing_keys[0]]
        showing_fields = {k: v for k, v in first.items() if "show" in k.lower()}
        print(f"\n  Showing fields in first listing ({listing_keys[0]}):")
        for k, v in showing_fields.items():
            print(f"    {k}: {json.dumps(v, ensure_ascii=False)[:200]}")
    
    print()
    break  # just check first cache file
