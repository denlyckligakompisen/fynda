
import json
import os

def load_json(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

daily = load_json("booli_daily_snapshot.json")
stockholm = load_json("booli_snapshot_stockholm.json")

print(f"Daily objects: {len(daily.get('objects', []))}")
print(f"Stockholm objects: {len(stockholm.get('objects', []))}")

# Find target
target_id = "5965916"
target_daily = next((o for o in daily.get("objects", []) if target_id in o.get("url", "")), None)
target_stock = next((o for o in stockholm.get("objects", []) if target_id in o.get("url", "")), None)

print(f"Target in Daily: {target_daily.get('pageViews') if target_daily else 'Not Found'}")
print(f"Target in Stock: {target_stock.get('pageViews') if target_stock else 'Not Found'}")

# Simulate Merge
unique_map = {}
raw_objects = []

# Order: Stockholm then Daily (like analyze.py)
if target_stock: raw_objects.append(target_stock)
if target_daily: raw_objects.append(target_daily)

for obj in raw_objects:
    u = obj.get("url")
    if u:
        if u in unique_map:
            existing = unique_map[u]
            if target_id in u:
                print(f"Collision for {u}")
                print(f"Existing views: {existing.get('pageViews')}, New views: {obj.get('pageViews')}")
            
            # Merge logic matches analyze.py
            obj["pageViews"] = max(obj.get("pageViews", 0) or 0, existing.get("pageViews", 0) or 0)
            obj["daysActive"] = max(obj.get("daysActive", 0) or 0, existing.get("daysActive", 0) or 0)
            
            if target_id in u:
                print(f"Merged views: {obj['pageViews']}")
            
        unique_map[u] = obj

final = unique_map.get(target_daily['url'] if target_daily else target_stock['url'])
print(f"Final Views: {final['pageViews'] if final else 'None'}")
