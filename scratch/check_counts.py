import json
import os

files = ["booli_daily_snapshot.json", "src/listing_data.json"]
for f in files:
    if os.path.exists(f):
        with open(f, "r", encoding="utf-8") as file:
            data = json.load(file)
            if isinstance(data, dict):
                print(f"{f}: {len(data.get('objects', []))} objects")
            else:
                print(f"{f}: {len(data)} objects (list)")
    else:
        print(f"{f}: Not found")
