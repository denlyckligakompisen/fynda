import os
import json

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        modified = False
        
        # Structure 1: { "objects": [ ... ] }
        if isinstance(data, dict) and "objects" in data and isinstance(data["objects"], list):
            for obj in data["objects"]:
                if isinstance(obj, dict) and "images" in obj and isinstance(obj["images"], list):
                    if len(obj["images"]) > 1:
                        obj["images"] = [obj["images"][0]]
                        modified = True
                        
        # Structure 2: [ ... ]
        elif isinstance(data, list):
            for obj in data:
                if isinstance(obj, dict) and "images" in obj and isinstance(obj["images"], list):
                    if len(obj["images"]) > 1:
                        obj["images"] = [obj["images"][0]]
                        modified = True
                        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Modified {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    for root, dirs, files in os.walk("."):
        if "node_modules" in root or ".git" in root or "booli_cache" in root:
            continue
        for file in files:
            if file.endswith(".json"):
                process_file(os.path.join(root, file))
