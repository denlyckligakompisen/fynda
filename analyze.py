import json
import sys
import os
import glob
import math
from datetime import datetime
from collections import defaultdict
import traceback

# =====================
# CONFIG & CONSTANTS
# =====================
DEFAULT_INPUT_FILES = [
    "booli_snapshot_stockholm.json",
    "booli_snapshot_uppsala.json",
    "booli_snapshot_topfloor.json",
    "booli_snapshot_uppsala_topfloor.json",
    "booli_daily_snapshot.json",
    "specific_listing.json",
    "booli_details_snapshot.json"
]
SNAPSHOTS_DIR = "snapshots"

GEO_CACHE_FILE = "geo_cache.json"

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
        "daysActive": obj.get("daysActive"),
        "isSold": obj.get("isSold", False)
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

    price_diff_percent = (diff / lp * 100) if lp and diff is not None else 0
    price_per_sqm = (lp / area) if area else None
    val_per_sqm = (ev / area) if area else None
    
    # Deal Score Calculation
    score_diff = (diff / lp) if lp and diff is not None else 0
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


    return {
        "priceDiffPercent": round(price_diff_percent, 2),
        "pricePerSqm": round(price_per_sqm, 2) if price_per_sqm else None,
        "valuationPerSqm": round(val_per_sqm, 2) if val_per_sqm else None,
        "dealScore": round(deal_score, 4),
        "isNew": is_new,
        "hasViewing": has_viewing,
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
            # Capture latest crawledAt from all files
            file_crawled_at = data.get("meta", {}).get("crawledAt")
            if file_crawled_at:
                if not crawled_at or file_crawled_at > crawled_at:
                    crawled_at = file_crawled_at
            
            loaded_files.append(fpath)
            
            fname = os.path.basename(fpath).lower()
            source_label = None
            if "uppsala" in fname:
                source_label = "Uppsala (top floor)" if "topfloor" in fname else "Uppsala"
            elif "stockholm" in fname:
                source_label = "Stockholm (top floor)" if "topfloor" in fname else "Stockholm"
            elif "topfloor" in fname:
                source_label = "Stockholm (top floor)"
            
            objs = data.get("objects", [])
            for o in objs:
                # If filename is city-specific, strictly enforce it
                if source_label:
                    o["searchSource"] = source_label
                # Otherwise, if it's a generic scan (daily/details), 
                # we don't set it here; we'll rely on the merge logic or a generic default later.
                elif not o.get("searchSource"):
                    o["searchSource"] = "Stockholm" # Final fallback for unknown
                
            raw_objects.extend(objs)
            
    # Deduplicate by URL
    unique_map = {}
    for obj in raw_objects:
        u = obj.get("url")
        if u:
            if u in unique_map:
                existing = unique_map[u]
                # Merge logic: Keep max views
                obj["pageViews"] = max(obj.get("pageViews", 0) or 0, existing.get("pageViews", 0) or 0)
                
                # Use newer daysActive if the published date is newer (re-listing)
                old_pub = existing.get("published")
                new_pub = obj.get("published")
                if old_pub and new_pub and new_pub > old_pub:
                    # Newer record is better for daysActive
                    pass
                else:
                    obj["daysActive"] = max(obj.get("daysActive", 0) or 0, existing.get("daysActive", 0) or 0)
                
                # Preserve other fields if missing in new but present in old
                preserve_fields = ["rooms", "livingArea", "rent", "floor", "latitude", "longitude", 
                                   "isSold", "listPrice", "published", "estimatedValue"]
                for field in preserve_fields:
                    if obj.get(field) is None and existing.get(field) is not None:
                        obj[field] = existing[field]
                
                # If either says it's sold, it's sold
                if existing.get("isSold"):
                    obj["isSold"] = True

                # Preserve 'Uppsala' if it was already set (don't let generic scans overwrite it)
                if "Uppsala" in existing.get("searchSource", ""):
                    obj["searchSource"] = existing["searchSource"]
                
            unique_map[u] = obj
            
    raw_objects = list(unique_map.values())
    
    # Load Cache
    geo_cache = load_json(GEO_CACHE_FILE) or {}
    
    try:
        # 2. Normalize & Enrich
        analyzed_objects = []
        for i, obj in enumerate(raw_objects):
            norm = normalize_object(obj)
            
            lat = norm.get("latitude")
            lon = norm.get("longitude")
            source = norm.get("searchSource", "")
            
            # Coordinate-based detection (fallback/correction)
            if lat and lat > 59.6:
                if "Uppsala" not in source:
                    norm["searchSource"] = "Uppsala (top floor)" if "top floor" in source.lower() else "Uppsala"
            elif lat and lat < 59.6:
                 if "Stockholm" not in source:
                    norm["searchSource"] = "Stockholm (top floor)" if "top floor" in source.lower() else "Stockholm"

            # Top Floor detection from URL
            source_page = norm.get("sourcePage", "")
            if "floor=topfloor" in source_page.lower():
                current_source = norm.get("searchSource", "")
                if "top floor" not in current_source.lower():
                    if "Uppsala" in current_source:
                        norm["searchSource"] = "Uppsala (top floor)"
                    else:
                        norm["searchSource"] = "Stockholm (top floor)"

            is_uppsala = "Uppsala" in norm.get("searchSource", "")
            
            
            metrics = calculate_metrics(norm, skip_geo=is_uppsala)
            full = {**norm, **metrics}
            analyzed_objects.append(full)
            
            # Autosave cache every 50 items to prevent total loss on crash
            if i > 0 and i % 50 == 0:
                save_json(GEO_CACHE_FILE, geo_cache)

    finally:
        # Always save cache, even if we crash mid-loop
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
