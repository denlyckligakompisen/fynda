import json
import os
import sys

# Mocking the process in analyze.py

def run_debug():
    filepath = "booli_snapshot_uppsala_topfloor.json"
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    fname = os.path.basename(filepath).lower()
    source_label = None
    if "uppsala" in fname:
        source_label = "Uppsala (top floor)" if "topfloor" in fname else "Uppsala"
    
    print(f"Source Label: {source_label}")

    target_url = "https://www.booli.se/bostad/3898550"
    
    found_obj = None
    for o in data.get("objects", []):
        if o.get("url") == target_url:
            found_obj = o
            break
            
    if not found_obj:
        print("Target object not found in file")
        return

    # Apply source label
    if source_label:
        found_obj["searchSource"] = source_label
        
    print(f"Object after load: searchSource='{found_obj.get('searchSource')}'")

    # Normalize logic
    norm = found_obj.copy() # Simplified normalize
    
    lat = norm.get("latitude")
    source = norm.get("searchSource", "")
    
    print(f"Lat: {lat}, Source: '{source}'")

    if lat and lat > 59.6:
        if "Uppsala" not in source:
             print("Applying Uppsala fix...")
             if "top floor" in source.lower():
                 norm["searchSource"] = "Uppsala (top floor)"
             else:
                 norm["searchSource"] = "Uppsala"
        else:
            print("Uppsala already in source, skipping fix")
            
    print(f"Final searchSource: '{norm.get('searchSource')}'")

if __name__ == "__main__":
    run_debug()
