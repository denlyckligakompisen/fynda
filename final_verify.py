import json
import os

def final_check():
    path = os.path.join('src', 'listing_data.json')
    if not os.path.exists(path):
        print(f"Error: {path} not found")
        return
        
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    objs = data.get('objects', [])
    print(f"Total Listings: {len(objs)}")
    
    target_url = "https://www.booli.se/bostad/223787"
    obj = next((o for o in objs if target_url in o.get('url', '')), None)
    if obj:
        print(f"Eskilsgatan 5B DaysActive: {obj.get('daysActive')}")
    else:
        print("Eskilsgatan 5B not found")

if __name__ == "__main__":
    final_check()
