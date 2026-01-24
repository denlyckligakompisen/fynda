import requests
import json

RESROBOT_KEY = "92511e65-cacb-4d92-895e-8a4c5c5954ed"
TARGET_LAT = 59.3683683
TARGET_LON = 18.0035037

# Coordinates for Tummelisas gata 3 (which has null commute)
lat = 59.36248614
lon = 17.94894222

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

print(f"Testing API for {lat}, {lon}...")
try:
    r = requests.get(url, params=params, timeout=10)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        trips = data.get("Trip", [])
        if trips:
            dur = trips[0].get("duration")
            print(f"Duration found: {dur}")
        else:
            print("No trips found in response")
            print(json.dumps(data, indent=2))
    else:
        print(r.text)
except Exception as e:
    print(f"Error: {e}")
