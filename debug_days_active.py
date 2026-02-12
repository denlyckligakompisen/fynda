import json
from datetime import datetime

def debug():
    try:
        with open('src/listing_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        objects = data.get('objects', [])
        meta = data.get('meta', {})
        
        with open('debug_days_active.txt', 'w', encoding='utf-8') as out:
            out.write(f"Total objects: {len(objects)}\n")
            out.write(f"Generated at: {meta.get('generatedAt')}\n")
            
            # Look for 223787
            target = next((o for o in objects if '223787' in o['url']), None)
            if target:
                out.write("\nListing 223787 (User Example):\n")
                out.write(json.dumps(target, indent=2, ensure_ascii=False) + "\n")
            else:
                out.write("\nListing 223787 not found in listing_data.json\n")
                
            # Top 20 by daysActive
            out.write("\nTop 20 by daysActive:\n")
            sorted_objs = sorted([o for o in objects if o.get('daysActive') is not None], key=lambda x: x['daysActive'], reverse=True)
            for o in sorted_objs[:20]:
                out.write(f"URL: {o['url']}, Days: {o['daysActive']}, Published: {o['published']}\n")
                
            # Objects with 0 daysActive
            zeros = [o for o in objects if o.get('daysActive') == 0]
            out.write(f"\nObjects with 0 daysActive: {len(zeros)}\n")
            for o in zeros[:20]:
                 out.write(f"URL: {o['url']}, Published: {o['published']}\n")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug()
