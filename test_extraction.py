import json
import sys
import os

# Append current dir to sys.path to import scraper
sys.path.append(os.getcwd())
import scraper

with open("debug_229036.html", "r", encoding="utf-8") as f:
    html = f.read()

results = scraper.extract_objects(html, "https://www.booli.se/bostad/229036")
with open("test_extraction_v2.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("Saved extraction results to test_extraction_v2.json")
