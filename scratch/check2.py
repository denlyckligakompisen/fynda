import json
from collections import Counter
with open('booli_daily_snapshot.json', encoding='utf-8') as f:
    d = json.load(f)
objects = d.get('objects', [])
areas = [o.get('area', 'Unknown') for o in objects]
print(Counter(areas).most_common(20))
