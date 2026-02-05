import json
from datetime import datetime

try:
    with open('src/listing_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    objects = data.get('objects', [])
    cutoff = '2026-02-01'
    
    recent = []
    for o in objects:
        pub = o.get('published')
        if pub and pub >= cutoff:
            recent.append(o)
            
    print(f"Total Objects: {len(objects)}")
    print(f"Items published >= {cutoff}: {len(recent)}")
    
    if recent:
        print("Example recent item:")
        print(f"URL: {recent[0].get('url')}")
        print(f"Published: {recent[0].get('published')}")
        print(f"Is New: {recent[0].get('isNew')}")
        
except Exception as e:
    print(f"Error: {e}")
