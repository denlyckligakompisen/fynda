
import requests
import re

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

URLS = {
    "Original (Should Work)": "https://www.booli.se/sok/till-salu?areaIds=115355,35,883816,3377,2983,115351,874646,874654&floor=topFloor&maxListPrice=4000000&minLivingArea=45&upcomingSale=",
    "Stockholm (No TopFloor)": "https://www.booli.se/sok/till-salu?areaIds=115355,35,883816,3377,2983,115351,874646,874654&maxListPrice=6000000&minLivingArea=35&upcomingSale=",
    "Uppsala (New)": "https://www.booli.se/sok/till-salu?q=Uppsala&maxListPrice=5000000&minLivingArea=35&upcomingSale="
}

def check(name, url):
    print(f"--- Checking {name} ---")
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        print(f"Status: {r.status_code}")
        if r.status_code != 200:
            return
        
        has_next = "booliId" in r.text
        print(f"Contains 'booliId': {has_next}")
        
    except Exception as e:
        print(f"Error: {e}")

for name, url in URLS.items():
    check(name, url)
