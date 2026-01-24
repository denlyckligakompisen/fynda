import requests
import sys

URL = "https://www.booli.se/bostad/141629"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

try:
    print(f"Fetching {URL}...")
    r = requests.get(URL, headers=HEADERS, timeout=10)
    html = r.text
    
    print(f"Status: {r.status_code}")
    print(f"Length: {len(html)}")
    
    from bs4 import BeautifulSoup
    import json
    
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", {"id": "__NEXT_DATA__"})
    
    if script:
        print("Found __NEXT_DATA__ script!")
        data = json.loads(script.string)
        with open("debug_next_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print("Saved to debug_next_data.json")
    else:
        print("Error: __NEXT_DATA__ script not found.")
        # Fallback search for text again just in case
        if "sidvisningar" in html:
            print("Found 'sidvisningar' in raw HTML (client-side render?)")
            
    print(f"Status: {r.status_code}")

except Exception as e:
    print(f"Error: {e}")
