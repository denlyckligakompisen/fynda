
import json
import os
import time
import random
from datetime import datetime
import scraper  # Import the scraper module

OUTPUT_FILE = "booli_details_snapshot.json"
SOURCE_FILE = "src/listing_data.json"

def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def run():
    print(f"Loading listings from {SOURCE_FILE}...")
    data = load_json(SOURCE_FILE)
    raw_objects = data.get("objects", [])
    
    # Deduplicate by URL to save time
    unique_objects = {}
    for obj in raw_objects:
        url = obj.get("url")
        if url and url not in unique_objects:
            unique_objects[url] = obj
    
    objects = list(unique_objects.values())
    print(f"Found {len(objects)} unique listings to check (from {len(raw_objects)} total).")
    
    results = []
    errors = []
    
    # Load existing progress if any
    if os.path.exists(OUTPUT_FILE):
        existing_data = load_json(OUTPUT_FILE)
        results = existing_data.get("objects", [])
        print(f"Loaded {len(results)} already scraped items.")
        
    scraped_urls = {o["url"] for o in results}
    
    for i, obj in enumerate(objects):
        url = obj.get("url")
        if not url:
            continue
            
        if url in scraped_urls:
            continue
            
        print(f"[{i+1}/{len(objects)}] Scraping {url}...")
        
        try:
            # 1. Fetch
            # cache_valid=False force refresh? No, let's respect cache if it's recent, 
            # but we likely don't have this specific page cached yet (since we scraped search pages mostly)
            # scraper.fetch handles caching.
            
            data, is_cached = scraper.fetch(url)
            
            if not data:
                print("  Failed to fetch.")
                errors.append(url)
                continue
                
            # 2. Parse
            # We use extract_objects but passed source_page=url
            extracted = scraper.extract_objects(data["html"], url)
            
            if extracted:
                # We usually get 1 object per item page
                # But sometimes it might return recommendations too?
                # extract_objects usually filters by regex or Apollo state.
                # Let's target the one that matches our booliId or URL
                
                target = None
                for candidate in extracted:
                    # Match by URL or ID
                    c_url = candidate.get("url", "")
                    if c_url and c_url in url:
                        target = candidate
                        break
                    if candidate.get("booliId") == obj.get("booliId"):
                        target = candidate
                        break
                
                # If no strict match, maybe the first one is it (listing page usually focuses on one object)
                if not target and len(extracted) > 0:
                     # Heuristic: the one with the longest description or matching address?
                     # Let's take the first one if it looks like a listing
                     target = extracted[0]

                if target:
                    # Ensure we keep the original searchSource if possible, or just tag it
                    target["searchSource"] = obj.get("searchSource", "Details Refresh")
                    print(f"  Success! Views: {target.get('pageViews')}, Days: {target.get('daysActive')}")
                    results.append(target)
                else:
                    print("  Parsed zero objects matching listing.")
            else:
                print("  No objects extracted.")

        except Exception as e:
            print(f"  Error: {e}")
            errors.append(url)
            
        # Autosave every 5 items
        if len(results) % 5 == 0:
            save_json(OUTPUT_FILE, {
                "meta": {"crawledAt": datetime.utcnow().isoformat()},
                "objects": results,
                "errors": errors
            })

        # Sleep a bit to be nice, unless cached
        # is_cached is returned by fetch?
        # scraper.fetch returns (data, is_cached)
        if not is_cached:
            time.sleep(random.uniform(1.0, 3.0))

    # Final save
    save_json(OUTPUT_FILE, {
        "meta": {"crawledAt": datetime.utcnow().isoformat()},
        "objects": results,
        "errors": errors
    })
    print("Done!")

if __name__ == "__main__":
    run()
