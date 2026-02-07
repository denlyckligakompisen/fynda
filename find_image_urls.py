import json
import re
import os

# Find a cache file
cache_dir = r"c:\Users\Fredrik\.gemini\antigravity\scratch\fynda\booli_cache"
files = [f for f in os.listdir(cache_dir) if f.endswith(".json")]
if not files:
    print("No cache files data")
    exit()

target = os.path.join(cache_dir, files[0])
print(f"Reading {target}")

with open(target, "r", encoding="utf-8") as f:
    data = json.load(f)
    html = data.get("html", "")
    # Find all bcdn.se image urls
    urls = re.findall(r'https?://[^"\s\'>]*bcdn\.se[^"\s\'>]*', html)
    seen = set()
    for u in urls:
        if u not in seen and ("images" in u or "cache" in u):
            print(u)
            seen.add(u)
            if len(seen) > 20: break
