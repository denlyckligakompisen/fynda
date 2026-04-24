"""Enrich the 5 objects with detail page data (totalFloors, etc.)."""
import json
import time
import random
from scraper import fetch, extract_objects, close_browser

with open("test_5_objects.json", "r", encoding="utf-8") as f:
    objects = json.load(f)

for obj in objects:
    url = obj["url"]
    print(f"\n--- Fetching detail: {url} ---")
    detail_data, cached = fetch(url, ttl_hours=168)
    
    if detail_data:
        html = detail_data.get("html", "")
        enriched = extract_objects(html, url)
        if enriched:
            match = next((x for x in enriched if x["booliId"] == obj["booliId"]), enriched[0])
            # Show what we got
            print(f"  floor: {match.get('floor')}, totalFloors: {match.get('totalFloors')}")
            print(f"  constructionYear: {match.get('constructionYear')}")
            print(f"  brfName: {match.get('brfName')}")
            print(f"  tags: {match.get('tags')}")
            print(f"  operatingCost: {match.get('operatingCost')}")
            print(f"  pageViews: {match.get('pageViews')}")
            print(f"  daysActive: {match.get('daysActive')}")
            
            # Merge enriched fields into original object
            for key in ["totalFloors", "constructionYear", "brfName", "tags", 
                        "operatingCost", "pageViews", "daysActive", "energyClass",
                        "apartmentNumber", "secondaryArea", "plotArea"]:
                if match.get(key) is not None:
                    obj[key] = match[key]
        else:
            print("  No objects extracted from detail page")
    else:
        print("  Fetch failed")
    
    if not cached:
        time.sleep(random.uniform(2.0, 4.0))

# Save enriched data
with open("test_5_objects.json", "w", encoding="utf-8") as f:
    json.dump(objects, f, ensure_ascii=False, indent=2)
print(f"\nSaved enriched data to test_5_objects.json")

close_browser()
