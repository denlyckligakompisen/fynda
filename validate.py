
import json
import os

try:
    with open("output.json", "r", encoding="utf-16") as f:
        data = json.load(f)
except Exception:
    with open("output.json", "r", encoding="utf-8") as f: # Fallback
        data = json.load(f)

print("Meta:", data["meta"])
print("Changes:", len(data["changes"]))
assert len(data["changes"]) > 0, "No changes detected"
assert len(data["rankings"]["bestDeals"]) > 0, "No best deals"
print("Validation OK")
