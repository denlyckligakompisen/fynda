
import json
from datetime import datetime

def check_viewings():
    try:
        with open('src/listing_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("listing_data.json not found")
        return

    objects = data.get('objects', [])
    today_str = "2026-02-22"
    
    viewings_today = []
    
    for obj in objects:
        showing = obj.get('nextShowing')
        if not showing:
            continue
            
        full_date = showing.get('fullDateAndTime', '')
        # Check if it contains "22 feb" or "Idag" (if it was scraped today)
        if "22 feb" in full_date.lower() or "2026-02-22" in full_date:
            viewings_today.append(obj)
            print(f"Found viewing today: {obj.get('address')} - {full_date}")

    print(f"\nTotal viewings found for {today_str}: {len(viewings_today)}")

if __name__ == "__main__":
    check_viewings()
