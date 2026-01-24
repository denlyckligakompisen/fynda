
import requests
import sys

url = "https://www.booli.se/annons/5965916"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

try:
    r = requests.get(url, headers=headers)
    print(f"Status: {r.status_code}")
    if "Visningar" in r.text or "sidvisningar" in r.text:
       print("Found 'Visningar' or 'sidvisningar' in text")
       
       # Print surrounding text
       idx = r.text.find("sidvisningar")
       if idx == -1: idx = r.text.find("Visningar")
       
       start = max(0, idx - 50)
       end = min(len(r.text), idx + 50)
       print(repr(r.text[start:end]))
       
    else:
       print("Could not find 'Visningar' keywords in text")
       
except Exception as e:
    print(e)
