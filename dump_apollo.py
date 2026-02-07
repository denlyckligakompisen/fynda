import json
import re
import os

cache_dir = r"c:\Users\Fredrik\.gemini\antigravity\scratch\fynda\booli_cache"
# Filter for search pages (usually larger or have unique markers)
files = sorted([f for f in os.listdir(cache_dir) if f.endswith(".json")], key=lambda x: os.path.getsize(os.path.join(cache_dir, x)), reverse=True)

for i in range(min(5, len(files))):
    target = os.path.join(cache_dir, files[i])
    with open(target, "r", encoding="utf-8") as f:
        data = json.load(f)
        html = data.get("html", "")
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
        if match:
            apollo = json.loads(match.group(1)).get("props", {}).get("pageProps", {}).get("__APOLLO_STATE__", {})
            # Look for an image in the state
            for k, v in apollo.items():
                if k.startswith("Image:"):
                    print(f"File {files[i]} has images")
                    # Break out and dump this apollo state
                    with open(f"apollo_search_{i}.json", "w", encoding="utf-8") as out:
                        json.dump(apollo, out, indent=2)
                    break
