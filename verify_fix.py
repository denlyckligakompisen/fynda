import json

def verify():
    try:
        with open('src/listing_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        target_url = "https://www.booli.se/bostad/223787"
        obj = next((o for o in data.get('objects', []) if target_url in o.get('url', '')), None)
        
        if obj:
            print(f"Listing: {target_url}")
            print(f"DaysActive: {obj.get('daysActive')}")
            print(f"Published: {obj.get('published')}")
            print(f"IsNew: {obj.get('isNew')}")
            
            if obj.get('daysActive') == 0:
                print("\nSUCCESS: daysActive is correctly 0.")
            else:
                print(f"\nFAILURE: daysActive is {obj.get('daysActive')}, expected 0.")
        else:
            print(f"Listing {target_url} not found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
