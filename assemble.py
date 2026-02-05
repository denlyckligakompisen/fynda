import os
import json
import glob
from scraper import extract_objects

CACHE_DIR = "booli_cache"
OUTPUT_FILE = "booli_daily_snapshot.json"

def assemble():
    all_objects = []
    files = glob.glob(os.path.join(CACHE_DIR, "*.json"))
    print(f"Found {len(files)} cached files.")

    for path in files:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            url = data.get("url", "")
            html = data.get("html", "")
            
            if not html:
                continue
                
            # Use the fixed extraction logic from scraper.py
            objects = extract_objects(html, url)
            all_objects.extend(objects)
            
        except Exception as e:
            print(f"Failed to process {path}: {e}")

    # Remove duplicates based on booliId
    unique_objects = {obj["booliId"]: obj for obj in all_objects if "booliId" in obj}
    final_list = list(unique_objects.values())

    snapshot = {
        "meta": {
            "crawledAt": "2026-02-05T12:00:00", # Approximate
            "pagesCrawled": len(files),
            "objectsFound": len(final_list),
            "cacheHitRatio": 1.0
        },
        "objects": final_list
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)
    
    print(f"Assembled {len(final_list)} objects into {OUTPUT_FILE}")

if __name__ == "__main__":
    assemble()
