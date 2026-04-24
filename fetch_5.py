"""Quick script: fetch first 5 objects from the Uppsala search URL."""
import sys
import json

# Reuse scraper infrastructure
from scraper import fetch, extract_objects, close_browser, SEARCH_URLS

TARGET_URL = "https://www.booli.se/sok/till-salu?areaIds=386699,386690,386688,870600&maxListPrice=4000000&minLivingArea=50&upcomingSale="

def main():
    print(f"Fetching: {TARGET_URL}")
    page_data, cached = fetch(TARGET_URL)

    if not page_data:
        print("ERROR: fetch returned no data.", file=sys.stderr)
        sys.exit(1)

    html = page_data.get("html", "")
    print(f"HTML length: {len(html)}, cached: {cached}")

    objects = extract_objects(html, TARGET_URL)
    print(f"Total objects extracted from page: {len(objects)}")

    first_5 = objects[:5]
    print(f"\n=== First 5 objects ===\n")
    print(json.dumps(first_5, ensure_ascii=False, indent=2))

    # Save to file
    with open("test_5_objects.json", "w", encoding="utf-8") as f:
        json.dump(first_5, f, ensure_ascii=False, indent=2)
    print(f"\nSaved to test_5_objects.json")

    close_browser()

if __name__ == "__main__":
    main()
