
import json
import requests

TARGET_LAT = 59.3683656
TARGET_LON = 18.0035037

def test():
    with open("booli_snapshot_stockholm.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    target_obj = None
    for obj in data["objects"]:
        if "Repslagargatan 25" in obj.get("address", ""):
            target_obj = obj
            break
            
    if not target_obj:
        print("Not found")
        return

    print("Found:", target_obj["address"])
    lat = target_obj["latitude"]
    lon = target_obj["longitude"]
    print(f"Coords: {lat}, {lon}")
    
    # Test OSRM
    url = f"http://router.project-osrm.org/route/v1/foot/{lon},{lat};{TARGET_LON},{TARGET_LAT}?overview=false"
    print(f"Testing OSRM: {url}")
    try:
        r = requests.get(url, timeout=10)
        print("Status:", r.status_code)
        if r.status_code == 200:
            print("Response:", r.text[:200])
            data = r.json()
            routes = data.get("routes", [])
            if routes:
                sec = routes[0].get("duration")
                print(f"Duration (sec): {sec}")
                print(f"Minutes: {sec/60}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
