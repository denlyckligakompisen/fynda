import json
import os

MAIN_FILE = "src/listing_data.json"
MERGE_FILE = "manual_fetch_kfm_enriched.json"

def merge():
    if not os.path.exists(MAIN_FILE):
        print(f"Main file {MAIN_FILE} not found.")
        return
    
    if not os.path.exists(MERGE_FILE):
        print(f"Merge file {MERGE_FILE} not found.")
        return

    with open(MAIN_FILE, "r", encoding="utf-8") as f:
        main_data = json.load(f)
    
    with open(MERGE_FILE, "r", encoding="utf-8") as f:
        merge_data = json.load(f)

    main_objects = main_data.get("objects", [])
    merge_objects = merge_data.get("objects", [])

    # Filter out existing objects with same booliId to avoid duplicates
    seen_ids = {obj["booliId"] for obj in main_objects if "booliId" in obj}
    
    newly_added = 0
    updated = 0
    
    for obj in merge_objects:
        booli_id = obj.get("booliId")
        if booli_id in seen_ids:
            # Update existing object
            for i, existing in enumerate(main_objects):
                if existing.get("booliId") == booli_id:
                    main_objects[i].update(obj)
                    updated += 1
                    break
        else:
            main_objects.append(obj)
            newly_added += 1

    main_data["objects"] = main_objects
    main_data["meta"]["crawledAt"] = merge_data["meta"]["crawledAt"]
    main_data["meta"]["objectsFound"] = len(main_objects)

    with open(MAIN_FILE, "w", encoding="utf-8") as f:
        json.dump(main_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully merged {newly_added} new and updated {updated} existing objects into {MAIN_FILE}.")

if __name__ == "__main__":
    merge()
