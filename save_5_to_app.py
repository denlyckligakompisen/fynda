"""Take the 5 raw scraped objects and save them in the app-ready format."""
import json, os
from datetime import datetime
from analyze import normalize_object, calculate_metrics

with open("test_5_objects.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

now = datetime.utcnow()
objects = []
for obj in raw:
    # Add searchSource (missing from raw scrape)
    obj["searchSource"] = "Uppsala"
    norm = normalize_object(obj, now)
    metrics = calculate_metrics(norm, skip_geo=True)
    objects.append({**norm, **metrics})

result = {
    "meta": {
        "generatedAt": now.isoformat(),
        "crawledAt": now.isoformat(),
        "inputFiles": ["test_5_objects.json"],
        "objectsAnalyzed": len(objects)
    },
    "objects": objects
}

for path in ["src/listing_data.json", "public/listing_data.json"]:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(objects)} objects to {path}")
