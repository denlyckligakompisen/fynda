import json
import os
import glob

def collect_houses():
    house_types = ['Villa', 'Radhus', 'Parhus', 'Kedjehus', 'Gård', 'Fritidshus']
    archived_houses = {}
    
    # Load existing archive if it exists
    archive_path = 'src/houses_archive.json'
    if os.path.exists(archive_path):
        try:
            with open(archive_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for obj in data.get('objects', []):
                    key = obj.get('booliId') or obj.get('url')
                    if key:
                        archived_houses[key] = obj
        except Exception as e:
            print(f"Error loading archive: {e}")

    # Search all JSON files for house objects
    for json_file in glob.glob('**/*.json', recursive=True):
        if 'node_modules' in json_file or 'archive' in json_file.lower():
            continue
            
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Check if it's a list or a dict with 'objects'
                objects = []
                if isinstance(data, list):
                    objects = data
                elif isinstance(data, dict):
                    objects = data.get('objects', [])
                
                for obj in objects:
                    if not isinstance(obj, dict): continue
                    
                    obj_type = obj.get('objectType', '')
                    if any(ht in obj_type for ht in house_types):
                        key = obj.get('booliId') or obj.get('url')
                        if key:
                            # Only add if not already in archive (or if we want to update it)
                            if key not in archived_houses:
                                archived_houses[key] = obj
                                print(f"Found house: {obj.get('address')} in {json_file}")
                                
        except Exception:
            # Skip files that aren't valid JSON or don't fit the expected structure
            continue

    # Save the archive
    output = {
        "meta": {
            "lastUpdated": "2026-05-02T09:49:00",
            "count": len(archived_houses)
        },
        "objects": list(archived_houses.values())
    }
    
    with open(archive_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Archive saved to {archive_path} with {len(archived_houses)} objects.")

if __name__ == "__main__":
    collect_houses()
