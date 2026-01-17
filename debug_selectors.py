import requests
import os

url = "https://www.booli.se/sok/till-salu?areaIds=115355,35,883816,3377,2983,115351,874646,874654&floor=topFloor&maxListPrice=4000000&minLivingArea=45&upcomingSale="
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

try:
    print(f"Fetching {url}...")
    r = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {r.status_code}")
    
    with open("debug_booli.html", "w", encoding="utf-8") as f:
        f.write(r.text)
    
    print("Saved HTML to debug_booli.html")
    print("Identify 'article' tags:", r.text.count("<article"))
    print("Identify 'data-testid' attributes:", r.text.count("data-testid"))
    
except Exception as e:
    print(f"Error: {e}")
