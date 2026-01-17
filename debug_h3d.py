
import json
import glob
import math

TARGET_LAT = 59.3683683
TARGET_LON = 18.0035037

def check():
    files = glob.glob('booli_snapshot_*.json')
    print(f"Checking files: {files}")
    
    found = False
    for fpath in files:
        with open(fpath, encoding='utf-8') as f:
            data = json.load(f)
            for obj in data.get('objects', []):
                if 'Huvudstagatan 3D' in obj.get('address', ''):
                    print(f"FOUND in {fpath}")
                    print(f"Address: {obj.get('address')}")
                    lat = obj.get('latitude')
                    lon = obj.get('longitude')
                    print(f"Coords: {lat}, {lon}")
                    
                    # Calculate Dist
                    R = 6371000
                    lat1 = math.radians(TARGET_LAT)
                    lon1 = math.radians(TARGET_LON)
                    lat2 = math.radians(float(lat))
                    lon2 = math.radians(float(lon))
                    
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                    dist_m = R * c
                    
                    print(f"Euclidean Dist: {dist_m:.2f} m")
                    
                    # Heuristic Walk Time
                    walk_dist = dist_m * 1.35
                    walk_time = walk_dist / 83.33
                    print(f"Heuristic Walk Time: {walk_time:.2f} min")
                    
                    found = True
                    return

    if not found:
        print("Not found")

if __name__ == '__main__':
    check()
