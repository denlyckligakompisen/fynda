import json
with open("src/listing_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    from collections import Counter
    uppsala_objs = [o for o in data.get("objects", []) if o.get("searchSource") == "Uppsala"]
    types = Counter(o.get("objectType") for o in uppsala_objs)
    print(f"Uppsala object types: {dict(types)}")
    print(f"Total objects: {len(data.get('objects', []))}")
