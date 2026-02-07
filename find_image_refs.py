import json
import os

with open("apollo_search_0.json", "r", encoding="utf-8") as f:
    apollo = json.load(f)

for k, v in apollo.items():
    if isinstance(v, dict):
        for vk, vv in v.items():
            if isinstance(vv, dict) and vv.get("__ref", "").startswith("Image:"):
                print(f"Key '{k}' has image ref in field '{vk}': {vv['__ref']}")
            elif isinstance(vv, list):
                for i, item in enumerate(vv):
                    if isinstance(item, dict) and item.get("__ref", "").startswith("Image:"):
                        print(f"Key '{k}' has image ref in list field '{vk}' at index {i}: {item['__ref']}")
