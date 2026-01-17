import requests
import json
import sys

API_KEY = "92511e65-cacb-4d92-895e-8a4c5c5954ed"
TARGET_LAT = 59.3683656
TARGET_LON = 18.0035037

# Test Origin (Stockholm Central approx)
ORIGIN_LAT = 59.330
ORIGIN_LON = 18.060

url = "https://api.resrobot.se/v2.1/trip"
params = {
    "format": "json",
    "accessId": API_KEY,
    "originCoordLat": ORIGIN_LAT,
    "originCoordLong": ORIGIN_LON,
    "destCoordLat": TARGET_LAT,
    "destCoordLong": TARGET_LON,
    "numF": 1, # Number of trips
}

try:
    print(f"Requesting {url} with params...")
    r = requests.get(url, params=params, timeout=10)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        trips = data.get("Trip", [])
        if trips:
            duration = trips[0].get("duration")
            print(f"Duration found: {duration}")
            # Format usually "PT25M" or similar ISO 8601
        else:
            print("No trips found.")
            print(json.dumps(data, indent=2))
    else:
        print(f"Error: {r.text}")
except Exception as e:
    print(f"Exception: {e}")
