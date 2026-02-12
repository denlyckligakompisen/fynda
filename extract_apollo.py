import re
import json

def extract():
    try:
        html = open('223787.html', 'r', encoding='utf-8').read()
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
        if not match:
            print("No __NEXT_DATA__ found")
            return
            
        data = json.loads(match.group(1))
        page_props = data.get('props', {}).get('pageProps', {})
        apollo = page_props.get('__APOLLO_STATE__', {})
        
        with open('apollo_debug.json', 'w', encoding='utf-8') as f:
            json.dump(apollo, f, indent=2, ensure_ascii=False)
            
        print(f"Extracted {len(apollo)} keys to apollo_debug.json")
        
        for k, v in apollo.items():
            if 'daysActive' in str(v):
                print(f"\nMatch in key: {k}")
                print(json.dumps(v, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract()
