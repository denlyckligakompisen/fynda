import json
import sys
import time
import os
import glob
import math
from datetime import datetime
from collections import defaultdict
import requests
import re
import traceback

# =====================
# CONFIG & CONSTANTS
# =====================
DEFAULT_INPUT_FILES = [
    "booli_snapshot_stockholm.json",
    "booli_snapshot_uppsala.json",
    "booli_snapshot_topfloor.json",
    "booli_snapshot_uppsala_topfloor.json"
]
SNAPSHOTS_DIR = "snapshots"

# ResRobot Config
RESROBOT_KEY = "92511e65-cacb-4d92-895e-8a4c5c5954ed"
TARGET_LAT = 59.3683683
TARGET_LON = 18.0035037
GEO_CACHE_FILE = "geo_cache.json"
WATER_COORDINATES = [
    (59.322, 18.055), # Riddarfjärden
    (59.340, 17.990), # Ulvsundasjön
    (59.330, 17.995), # Essingefjärden
    (59.305, 18.045), # Årstaviken
    (59.355, 18.055), # Brunnsviken
    (59.328, 18.090), # Djurgårdsbrunnsviken
    (59.367, 18.000), # Solna/Sundbyberg water (Bällstaviken)
    (59.310, 18.100), # Hammarby Sjö / Saltsjön
    (59.858, 17.639), # Fyrisån (Central Uppsala)
    (59.855, 17.645), # Svandammen (Uppsala)
    (59.790, 17.650), # Ekoln (Uppsala)
]

# =====================
# UTILS
# =====================
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000 # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R*c

def get_min_dist_to_water(lat, lon):
    if not lat or not lon: return None
    min_dist = float('inf')
    for w_lat, w_lon in WATER_COORDINATES:
        dist = haversine_distance(lat, lon, w_lat, w_lon)
        if dist < min_dist:
            min_dist = dist
    return int(min_dist)
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
    # DISABLED FOR SPEED - rely on cache only
    try:
        # url = "https://api.resrobot.se/v2.1/trip"
        # params = {
        #     "format": "json",
        #     "accessId": RESROBOT_KEY,
        #     "originCoordLat": lat,
        #     "originCoordLong": lon,
        #     "destCoordLat": TARGET_LAT,
        #     "destCoordLong": TARGET_LON,
        #     "numF": 1
        # }
        # time.sleep(1.0) # Graceful delay for ResRobot
        # r = requests.get(url, params=params, timeout=10)
        # if r.status_code == 200:
        #     data = r.json()
        #     trips = data.get("Trip", [])
        #     if trips:
        #         dur = trips[0].get("duration")
        #         result["commute"] = parse_duration(dur)
        pass
    except Exception as e:
        print(f"Error fetching commute: {e}", file=sys.stderr)

    # Only cache if we got a valid result.
    # If API fails or returns no trips (temporary?), we don't want to cache None forever.
    if result["commute"] is not None:
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

    dist_water = get_min_dist_to_water(obj.get("latitude"), obj.get("longitude"))

    return {
        "url": obj.get("url", ""),
        "address": obj.get("address"),
        "area": area,
        "city": city,
        "listPrice": obj.get("listPrice"),
        "soldPrice": obj.get("soldPrice"),
        "pageViews": obj.get("pageViews", 0),
        "estimatedValue": obj.get("estimatedValue"),
        "priceDiff": obj.get("priceDiff"),
        "rooms": obj.get("rooms"),
        "livingArea": obj.get("livingArea"),
        "rent": obj.get("rent"),
        "floor": obj.get("floor"),
        "biddingOpen": obj.get("biddingOpen"),
        "nextShowing": obj.get("nextShowing"),
        "published": obj.get("published"),
        "latitude": obj.get("latitude"),
        "longitude": obj.get("longitude"),
        "sourcePage": obj.get("sourcePage", ""),
        "searchSource": obj.get("searchSource", "Stockholm"),
        "waterDistance": dist_water,
        "daysActive": obj.get("daysActive")
    }

def calculate_metrics(obj, skip_geo=False):
    """Compute derived metrics for a normalized object."""
    lp = obj["listPrice"]
    ev = obj["estimatedValue"]
    diff = obj["priceDiff"]
    area = obj["livingArea"]
    rooms = obj["rooms"]
    
    # Safety checks
    if lp is None or ev is None:
        return {
            "priceDiffPercent": None,
            "pricePerSqm": None,
            "valuationPerSqm": None,
            "dealScore": None,
            "isNew": False,
            "hasViewing": False,
            "distanceMeters": None,
            "walkingTimeMinutes": None,
            "bicycleTimeMinutes": None,
            "pageViewsPerDay": None
        }

    price_diff_percent = (diff / lp * 100) if lp else 0
    price_per_sqm = (lp / area) if area else None
    val_per_sqm = (ev / area) if area else None
    
    # Deal Score Calculation
    score_diff = (diff / lp) if lp else 0
    score_area = (area / 100) if area else 0
    score_rooms = (rooms / 5) if rooms else 0
    
    deal_score = (score_diff * 0.6) + (score_area * 0.3) + (score_rooms * 0.1)
    
    # Calculate 'isNew' (max 7 days)
    is_new = False
    
    # Prefer scraped daysActive, otherwise calc from published
    days_active_val = obj.get("daysActive")
    
    if days_active_val is not None:
        if days_active_val <= 7:
            is_new = True
    else:
        pub_str = obj.get("published")
        if pub_str:
            try:
                pub_date = datetime.strptime(pub_str, "%Y-%m-%d %H:%M:%S")
                age = datetime.now() - pub_date
                if age.days <= 7:
                    is_new = True
            except ValueError:
                pass

    # Page Views Per Day
    page_views = obj.get("pageViews", 0)
    days_active_denom = 1
    
    if days_active_val is not None:
        days_active_denom = max(1, days_active_val)
    else:
        pub_str = obj.get("published")
        if pub_str:
            try:
                pub_date = datetime.strptime(pub_str, "%Y-%m-%d %H:%M:%S")
                age = datetime.now() - pub_date
                days_active_denom = max(1, age.days)
            except ValueError:
                pass
            
    views_per_day = round(page_views / days_active_denom) if page_views else 0

    # Check viewing
    has_viewing = bool(obj.get("nextShowing"))

    # Distance & Walking Time
    target_lat = 59.3683656
    target_lon = 18.0035037
    
    dist_m = None
    walk_min = None
    bike_min = None
    
    if not skip_geo and obj.get("latitude") and obj.get("longitude"):
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
        "distanceMeters": None,
        "walkingTimeMinutes": round(walk_min) if walk_min is not None else None,
        "bicycleTimeMinutes": round(bike_min) if bike_min is not None else None,
        "pageViewsPerDay": views_per_day
    }

def get_latest_historical_snapshot(current_file_path):
    """Return the path to the previous successful data file."""
    # We now use src/listing_data.json as the single source of truth for "previous state"
    path = "src/listing_data.json"
    if os.path.exists(path):
        return path
    return None

def detect_changes(current_objs, old_objs):
    """Compare two lists of objects and return changes."""
    old_map = {o["url"]: o for o in old_objs}
    curr_map = {o["url"]: o for o in current_objs}
    
    changes = []
    
    for url, curr in curr_map.items():
        if url not in old_map:
            changes.append({"url": url, "type": "new", "details": "New listing"})
        else:
            old = old_map[url]
            if curr["listPrice"] != old["listPrice"]:
                changes.append({
                    "url": url, 
                    "type": "priceChanged", 
                    "details": f"Price {old.get('listPrice')} -> {curr.get('listPrice')}"
                })
            elif curr["estimatedValue"] != old["estimatedValue"]:
                changes.append({
                    "url": url, 
                    "type": "valuationChanged", 
                    "details": f"Valuation {old.get('estimatedValue')} -> {curr.get('estimatedValue')}"
                })

    for url in old_map:
        if url not in curr_map:
            changes.append({"url": url, "type": "removed", "details": "Listing removed"})
            
    return changes

def run():
    # 1. Load Data
    input_files = DEFAULT_INPUT_FILES
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
    crawled_at = None
    
    for fpath in input_files:
        data = load_json(fpath)
        if data:
            # Capture crawledAt from the last file (or first, doesn't matter much if single run)
            crawled_at = data.get("meta", {}).get("crawledAt")
            
            loaded_files.append(fpath)
            
            fname = os.path.basename(fpath).lower()
            source_label = "Stockholm" # Default
            
            if "uppsala" in fname:
                if "topfloor" in fname:
                    source_label = "Uppsala (top floor)"
                else:
                    source_label = "Uppsala"
            elif "topfloor" in fname:
                # Covers booli_snapshot_topfloor.json
                source_label = "Stockholm (top floor)"
            elif "stockholm" in fname:
                source_label = "Stockholm"
            
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
        
        lat = norm.get("latitude")
        lon = norm.get("longitude")
        
        is_uppsala = "Uppsala" in norm.get("searchSource", "")
        
        if not is_uppsala:
             geo_info = get_geo_info(lat, lon, geo_cache)
             norm["commuteTimeMinutes"] = geo_info.get("commute")
             norm["walkingTimeMinutes"] = geo_info.get("walk")
        else:
             norm["commuteTimeMinutes"] = None
             norm["walkingTimeMinutes"] = None
        
        metrics = calculate_metrics(norm, skip_geo=is_uppsala)
        full = {**norm, **metrics}
        analyzed_objects.append(full)
        
    save_json(GEO_CACHE_FILE, geo_cache)
        
    # 3. Aggregations
    best_deals = sorted(
        [x for x in analyzed_objects if x["dealScore"] is not None], 
        key=lambda x: x["dealScore"], 
        reverse=True
    )[:10]
    
    positive_diffs = sorted(
        [x for x in analyzed_objects if x["priceDiff"] and x["priceDiff"] > 0],
        key=lambda x: x["priceDiff"],
        reverse=True
    )

    by_area = defaultdict(list)
    for x in analyzed_objects:
        if x["area"]:
            by_area[x["area"]].append(x)
            
    by_rooms = defaultdict(list)
    for x in analyzed_objects:
        if x["rooms"] is not None:
            by_rooms[x["rooms"]].append(x)

    # 4. Change Detection
    # 4. Change Detection
    changes = []
    # Always check against src/data.json for changes
    hist_file = "src/listing_data.json"
    
    if os.path.exists(hist_file):
        hist_data = load_json(hist_file)
        if hist_data:
            changes = detect_changes(raw_objects, hist_data.get("objects", []))
            
    # 5. Output
    output = {
        "meta": {
            "generatedAt": datetime.utcnow().isoformat(),
            "crawledAt": crawled_at,
            "inputFiles": loaded_files,
            "objectsAnalyzed": len(analyzed_objects)
        },
        "objects": analyzed_objects,
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
    try:
        result = run()
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        try:
            os.makedirs("src", exist_ok=True)
            with open("src/listing_data.json", "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Warning: Could not write to src/listing_data.json: {e}", file=sys.stderr)
            
    except Exception:
        traceback.print_exc()
        sys.exit(1)
