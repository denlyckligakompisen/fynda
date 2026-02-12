import requests
import time

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

url = "https://auktionstorget.kronofogden.se/Sokfastigheterbostadsratter.html?sv.url=12.6294450154af3d2b27d64&query=*&100.6294450154af3d2b27d91=03"

try:
    print(f"Fetching {url}...")
    r = requests.get(url, headers=headers, timeout=30)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        with open("kfm_search_uppsala.html", "w", encoding="utf-8") as f:
            f.write(r.text)
        print("Saved to kfm_search_uppsala.html")
    else:
        print(f"Error content: {r.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
