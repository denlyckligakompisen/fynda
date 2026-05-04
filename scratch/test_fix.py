import json
import re
import os
import sys
from bs4 import BeautifulSoup

# Import from scraper if possible, or just copy the necessary parts
sys.path.append(os.getcwd())
from scraper import extract_objects

cache_file = "booli_cache/03bb313b901d148240c40252aabb2b1b00afabe672741e2487e1a507d7e5e431.json"
with open(cache_file, "r", encoding="utf-8") as f:
    data = json.load(f)

html = data["html"]
url = data["url"]

objects = extract_objects(html, url)
print(f"Extracted {len(objects)} objects from page.")

for i, obj in enumerate(objects[:3]):
    print(f"{i+1}: {obj['address']} ({obj['area']}) - {obj['listPrice']} kr, {obj['livingArea']} m2")

# Check if any small objects (like the user's 21 m2 example) are still there
small_objects = [o for o in objects if o.get('livingArea') and o['livingArea'] < 30]
if small_objects:
    print(f"\nWARNING: Found {len(small_objects)} objects under 30 m2!")
    for o in small_objects:
        print(f"  - {o['address']} ({o['livingArea']} m2)")
else:
    print("\nNo small objects (<30 m2) found. Filtering seems to work!")
