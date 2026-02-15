
import scraper
import json
import sys

# URLs to test
urls = [
    "https://www.booli.se/bostad/224111",
    "https://www.booli.se/bostad/3898550",
    "https://www.booli.se/bostad/229274"
]

print("Debugging scraper for specific URLs...")

for url in urls:
    print(f"\nFetching {url}...")
    try:
        page_data, cached = scraper.fetch(url)
        if not page_data:
            print(f"Failed to fetch {url}")
            continue
            
        html = page_data.get("html", "")
        objects = scraper.extract_objects(html, url)
        
        if not objects:
            print("No objects found.")
        else:
            for obj in objects:
                print(f"ID: {obj.get('booliId')}")
                print(f"Address: {obj.get('address')}")
                print(f"Days Active: {obj.get('daysActive')}")
                print(f"Published: {obj.get('published')}")
                # Print raw object for inspection if needed
                # print(json.dumps(obj, indent=2))
                
    except Exception as e:
        print(f"Error: {e}")
