import json
import sys
import os
import glob
import math
from datetime import datetime
from collections import defaultdict

# =====================
# CONFIG & CONSTANTS
# =====================
# =====================
# CONFIG & CONSTANTS
# =====================
DEFAULT_INPUT_FILE = "booli_daily_snapshot.json"
SNAPSHOTS_DIR = "snapshots"

# ResRobot Config
RESROBOT_KEY = "92511e65-cacb-4d92-895e-8a4c5c5954ed"
TARGET_LAT = 59.3683683
TARGET_LON = 18.0035037
GEO_CACHE_FILE = "geo_cache.json"

# =====================
# UTILS
# =====================
def load_json(filepath):
    try:
        if not os.path.exists(filepath):
            return {}
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load {filepath}: {e}", file=sys.stderr)
        return {}

def save_json(filepath, data):
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save {filepath}: {e}", file=sys.stderr)

import time
import requests
import re

def parse_duration(pt_string):
    """Parse PT25M, PT1H10M etc to minutes."""
    if not pt_string: return None
    h = 0
    m = 0
    match_h = re.search(r'(\d+)H', pt_string)
    match_m = re.search(r'(\d+)M', pt_string)
    if match_h: h = int(match_h.group(1))
    if match_m: m = int(match_m.group(1))
    return h * 60 + m

def get_geo_info(lat, lon, cache):
    """Get commute and walking time. Returns dict {commute: min, walk: min}."""
    if not lat or not lon: return {"commute": None, "walk": None}
    
    key = f"{lat},{lon}"
    if key in cache:
        return cache[key]
    
    result = {"commute": None, "walk": None}
    
    # 1. ResRobot (Commute)
    try:
        url = "https://api.resrobot.se/v2.1/trip"
        params = {
            "format": "json",
            "accessId": RESROBOT_KEY,
            "originCoordLat": lat,
            "originCoordLong": lon,
            "destCoordLat": TARGET_LAT,
            "destCoordLong": TARGET_LON,
            "numF": 1
        }
        r = requests.get(url, params=params, timeout=10)
        if r.status_code == 200:
            data = r.json()
            trips = data.get("Trip", [])
            if trips:
                dur = trips[0].get("duration")
                result["commute"] = parse_duration(dur)
    except Exception as e:
        print(f"Error fetching commute: {e}", file=sys.stderr)

    cache[key] = result
    return result

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
        "biddingOpen": obj.get("biddingOpen"),
        "nextShowing": obj.get("nextShowing"),
        "published": obj.get("published"),
        "latitude": obj.get("latitude"),
        "longitude": obj.get("longitude"),
        "sourcePage": obj.get("sourcePage", ""),
        "searchSource": obj.get("searchSource", "Stockholm")
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
    
    # Calculate 'isNew' (max 7 days)
    is_new = False
    pub_str = obj.get("published")
    if pub_str:
        try:
            # Format: "2026-01-17 03:29:14"
            pub_date = datetime.strptime(pub_str, "%Y-%m-%d %H:%M:%S")
            age = datetime.now() - pub_date
            if age.days <= 7:
                is_new = True
        except ValueError:
            pass

    # Check viewing
    has_viewing = bool(obj.get("nextShowing"))

    # Distance & Walking Time
    # Target: 59.3683656, 18.0035037
    target_lat = 59.3683656
    target_lon = 18.0035037
    
    dist_m = None
    walk_min = None
    
    if obj.get("latitude") and obj.get("longitude"):
        try:
            R = 6371000 # Earth radius in meters
            lat1 = math.radians(target_lat)
            lon1 = math.radians(target_lon)
            lat2 = math.radians(float(obj["latitude"]))
            lon2 = math.radians(float(obj["longitude"]))
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            
            dist_m = R * c
            
            # Travel Time Calculations
            # Walking: 5 km/h = 83.33 m/min
            # Biking: 18 km/h = 300 m/min
            # Heuristic: Distance is approx 1.35x Euclidean distance (Road network curvature)
            travel_dist_est = dist_m * 1.35
            
            walk_min = travel_dist_est / 83.33
            bike_min = travel_dist_est / 300.0

        except Exception:
            pass

    return {
        "priceDiffPercent": round(price_diff_percent, 2),
        "pricePerSqm": round(price_per_sqm, 2) if price_per_sqm else None,
        "valuationPerSqm": round(val_per_sqm, 2) if val_per_sqm else None,
        "dealScore": round(deal_score, 4),
        "isNew": is_new,
        "hasViewing": has_viewing,
        "distanceMeters": round(dist_m) if dist_m is not None else None,
        "walkingTimeMinutes": round(walk_min) if walk_min is not None else None,
        "bicycleTimeMinutes": round(bike_min) if bike_min is not None else None
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
    input_files = [DEFAULT_INPUT_FILE]
    
    # If args provided, assume they are input files (supports globs)
    if len(sys.argv) > 1:
        raw_args = sys.argv[1:]
        input_files = []
        for arg in raw_args:
            if "*" in arg or "?" in arg:
                input_files.extend(glob.glob(arg))
            else:
                input_files.append(arg)
                
    if not input_files:
        print("No input files found.", file=sys.stderr)
        return {"meta": {"error": "No input files"}, "objects": [], "errors": []}

    raw_objects = []
    loaded_files = []
    
    for fpath in input_files:
        data = load_json(fpath)
        if data:
            loaded_files.append(fpath)
            
            # Determine source label from filename
            fname = os.path.basename(fpath).lower()
            source_label = "Stockholm" # Default
            if "topfloor" in fname:
                source_label = "Stockholm (top floor)"
            elif "stockholm" in fname:
                source_label = "Stockholm"
            
            # Inject source label into objects
            objs = data.get("objects", [])
            for o in objs:
                o["searchSource"] = source_label
                
            raw_objects.extend(objs)
            
    # Deduplicate by URL
    unique_map = {}
    for obj in raw_objects:
        u = obj.get("url")
        if u:
            unique_map[u] = obj
            
    raw_objects = list(unique_map.values())
    
    # Load Cache
    geo_cache = load_json(GEO_CACHE_FILE) or {}
    
    # 2. Normalize & Enrich
    analyzed_objects = []
    for obj in raw_objects:
        norm = normalize_object(obj)
        
        # Calculate Geo (Commute & Walk)
        lat = norm.get("latitude")
        lon = norm.get("longitude")
        geo_info = get_geo_info(lat, lon, geo_cache)
        
        norm["commuteTimeMinutes"] = geo_info.get("commute")
        norm["walkingTimeMinutes"] = geo_info.get("walk")
        
        metrics = calculate_metrics(norm)
        # Merge
        full = {**norm, **metrics}
        analyzed_objects.append(full)
        
    # Save Cache
    save_json(GEO_CACHE_FILE, geo_cache)
        
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
    # For simplicity, detect changes against the latest history of the FIRST input file (primary scan)
    # or just look for ANY history?
    # Let's use the first loaded file as the reference for history finding, or assume history is unified.
    # Current history system is file-based.
    hist_file = None
    if loaded_files:
        hist_file = get_latest_historical_snapshot(loaded_files[0])
        
    if hist_file:
        hist_data = load_json(hist_file)
        if hist_data:
             # We might be comparing a merged dataset against a single file history.
             # Ideally we should merge history too, but that's complex.
             # Let's compare against the last snapshot which likely contained similar data.
            changes = detect_changes(raw_objects, hist_data.get("objects", []))
            
    # 5. Final Output Construction
    output = {
        "meta": {
            "generatedAt": datetime.utcnow().isoformat(),
            "inputFiles": loaded_files,
            "objectsAnalyzed": len(analyzed_objects)
        },
        "objects": analyzed_objects,  # Export full list for frontend
        "rankings": {
            "bestDeals": best_deals,
            "positivePriceDiff": positive_diffs
        },
        "groups": {
            "byArea": dict(by_area),
            "byRooms": dict(by_rooms)
        },
        "changes": changes,
        "errors": []
    }
    
    return output

if __name__ == "__main__":
    result = run()
    
    # Write to stdout as before
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Also write to src/data.json for the frontend
    try:
        os.makedirs("src", exist_ok=True)
        with open("src/data.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: Could not write to src/data.json: {e}", file=sys.stderr)


