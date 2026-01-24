
import requests
import re
import sys
from bs4 import BeautifulSoup

URL = "https://www.booli.se/sok/till-salu?q=Uppsala&maxListPrice=5000000&minLivingArea=35&upcomingSale="
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

def find_pages(url):
    print(f"Fetching {url}...")
    r = requests.get(url, headers=HEADERS)
    print(f"Status: {r.status_code}")
    print(f"Response URL: {r.url}")
    print(f"Response Preview: {r.text[:500]}")
    if r.status_code != 200:
        return []
    
    # Simple check for objects
    if "booliId" in r.text:
        print("Found 'booliId' in response text.")
    else:
        print("DID NOT find 'booliId' in response text.")
        
    # Check for hydration data
    match = re.search(r'__NEXT_DATA__\s*=\s*({.+?});', r.text)
    if match:
        print("Found __NEXT_DATA__ block.")
    else:
        print("DID NOT find __NEXT_DATA__ block.")
        
    return [url]

if __name__ == "__main__":
    find_pages(URL)
