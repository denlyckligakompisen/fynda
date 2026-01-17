import json
import sys
import os
import glob
from datetime import datetime
from collections import defaultdict

# =====================
# CONFIG & CONSTANTS
# =====================
DEFAULT_INPUT_FILE = "booli_daily_snapshot.json"
SNAPSHOTS_DIR = "snapshots"

# =====================
# UTILS
# =====================
def load_json(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load {filepath}: {e}", file=sys.stderr)
        return None

def normalize_object(obj):
    """Ensure consistent schema for a single property object."""
    raw_area = obj.get("area") or ""
    
    # Extract City if present (Format: "Area, City")
    if "," in raw_area:
        parts = [p.strip() for p in raw_area.split(",")]
        # Assumption: Last part is City, first part is Area (or multiple parts for area)
        city = parts[-1]
        area = ", ".join(parts[:-1])
    else:
        area = raw_area
        city = None

    return {
        "url": obj.get("url", ""),
        "address": obj.get("address"),
        "area": area,
        "city": city,
        "listPrice": obj.get("listPrice"),
        "estimatedValue": obj.get("estimatedValue"),
        "priceDiff": obj.get("priceDiff"),
        "rooms": obj.get("rooms"),
        "livingArea": obj.get("livingArea"),
        "floor": obj.get("floor"),
        "sourcePage": obj.get("sourcePage", "")
    }

def calculate_metrics(obj):
    """Compute derived metrics for a normalized object."""
    lp = obj["listPrice"]
    ev = obj["estimatedValue"]
    diff = obj["priceDiff"]  # Should be ev - lp, but trust source or recalc? requested: "compute additional fields"
    area = obj["livingArea"]
    rooms = obj["rooms"]
    
    # Safety checks
    if lp is None or ev is None:
        return {
            "priceDiffPercent": None,
            "pricePerSqm": None,
            "valuationPerSqm": None,
            "dealScore": None
        }

    # Recalculate priceDiff to be safe or just use it? User said "Produce ... without modifying source data"
    # But for derived, we can compute.
    
    price_diff_percent = (diff / lp * 100) if lp else 0
    price_per_sqm = (lp / area) if area else None
    val_per_sqm = (ev / area) if area else None
    
    # Deal Score Calculation
    # Suggested: (priceDiff / listPrice) * 0.6 + (livingArea / 100) * 0.3 + (rooms / 5) * 0.1
    # Note: priceDiff/listPrice is the fraction (e.g. 0.1 for 10%), not percent
    
    score_diff = (diff / lp) if lp else 0
    score_area = (area / 100) if area else 0
    score_rooms = (rooms / 5) if rooms else 0
    
    deal_score = (score_diff * 0.6) + (score_area * 0.3) + (score_rooms * 0.1)

    return {
        "priceDiffPercent": round(price_diff_percent, 2),
        "pricePerSqm": round(price_per_sqm, 2) if price_per_sqm else None,
        "valuationPerSqm": round(val_per_sqm, 2) if val_per_sqm else None,
        "dealScore": round(deal_score, 4)
    }

def get_latest_historical_snapshot(current_file_path):
    """Find the most recent snapshot file excluding the current one."""
    files = glob.glob(os.path.join(SNAPSHOTS_DIR, "*.json"))
    # Filter out current if it happens to be in there
    files = [f for f in files if os.path.abspath(f) != os.path.abspath(current_file_path)]
    if not files:
        return None
    # Sort by filename (assumes YYYY-MM-DD naming) or mtime
    return sorted(files)[-1]

def detect_changes(current_objs, old_objs):
    """Compare two lists of objects and return changes."""
    old_map = {o["url"]: o for o in old_objs}
    curr_map = {o["url"]: o for o in current_objs}
    
    changes = []
    
    # New & Changed
    for url, curr in curr_map.items():
        if url not in old_map:
            changes.append({"url": url, "type": "new", "details": "New listing"})
        else:
            old = old_map[url]
            # Check price change
            if curr["listPrice"] != old["listPrice"]:
                changes.append({
                    "url": url, 
                    "type": "priceChanged", 
                    "details": f"Price {old.get('listPrice')} -> {curr.get('listPrice')}"
                })
            # Check valuation change
            elif curr["estimatedValue"] != old["estimatedValue"]:
                changes.append({
                    "url": url, 
                    "type": "valuationChanged", 
                    "details": f"Valuation {old.get('estimatedValue')} -> {curr.get('estimatedValue')}"
                })
            else:
                # changes.append({"url": url, "type": "unchanged"}) # User asked to label, maybe just include in separate list or field?
                # "Detect and label each object as: new, removed, priceChanged, valuationChanged, unchanged"
                # Since the output format shows "changes" as a list, I'll assume it wants a list of ALL objects with their status?
                # Or just a list of *events*? "match objects primarily by url".
                # Let's attach the status to the object itself in the main list, OR provide a change log?
                # The "Primary output (JSON)" has a "changes": [ ... ] section.
                # Usually this implies a delta list. But the requirement says "Detect and label each object as...".
                # I will produce a list of change events for the "changes" key.
                pass

    # Removed
    for url in old_map:
        if url not in curr_map:
            changes.append({"url": url, "type": "removed", "details": "Listing removed"})
            
    return changes

# =====================
# MAIN
# =====================
def run():
    # 1. Load Data
    input_file = DEFAULT_INPUT_FILE
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        
    raw_data = load_json(input_file)
    if not raw_data:
        # Fallback handling or error
        return {
            "meta": {"generatedAt": datetime.utcnow().isoformat(), "error": "Could not load input file"},
            "rankings": {}, "groups": {}, "changes": [], "errors": ["Input file missing"]
        }

    raw_objects = raw_data.get("objects", [])
    
    # 2. Normalize & Enrich
    analyzed_objects = []
    for obj in raw_objects:
        norm = normalize_object(obj)
        metrics = calculate_metrics(norm)
        # Merge
        full = {**norm, **metrics}
        analyzed_objects.append(full)
        
    # 3. Aggregations
    # Best deals (descending dealScore)
    best_deals = sorted(
        [x for x in analyzed_objects if x["dealScore"] is not None], 
        key=lambda x: x["dealScore"], 
        reverse=True
    )[:10]
    
    # Largest price drops (assuming priceDiff is Valuation - Price ?)
    # User said "priceDiff". Usually +priceDiff means Valuation > Price (Good).
    # "Only positive priceDiff" requested.
    # Note: If "Largest Price Drops" usually means "Price dropped from previous", that's different.
    # But context implies "Good Deals" / "Under Market Value".
    # User requested: "Only positive priceDiff" as a ranked view.
    # Let's call it "positivePriceDiff".
    positive_diffs = sorted(
        [x for x in analyzed_objects if x["priceDiff"] and x["priceDiff"] > 0],
        key=lambda x: x["priceDiff"],
        reverse=True
    )

    # Grouping
    by_area = defaultdict(list)
    for x in analyzed_objects:
        if x["area"]:
            by_area[x["area"]].append(x)
            
    by_rooms = defaultdict(list)
    for x in analyzed_objects:
        if x["rooms"] is not None:
            by_rooms[x["rooms"]].append(x)

    # 4. Change Detection
    changes = []
    hist_file = get_latest_historical_snapshot(input_file)
    if hist_file:
        hist_data = load_json(hist_file)
        if hist_data:
            changes = detect_changes(raw_objects, hist_data.get("objects", []))
            
    # 5. Final Output Construction
    output = {
        "meta": {
            "generatedAt": datetime.utcnow().isoformat(),
            "inputFiles": [input_file, hist_file] if hist_file else [input_file],
            "objectsAnalyzed": len(analyzed_objects)
        },
        "rankings": {
            "bestDeals": best_deals,
            "positivePriceDiff": positive_diffs
        },
        "groups": {
            "byArea": dict(by_area),
            "byRooms": dict(by_rooms)
        },
        "changes": changes,
        "errors": raw_data.get("errors", [])
    }
    
    return output

if __name__ == "__main__":
    result = run()
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)

