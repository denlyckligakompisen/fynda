import json
with open('booli_daily_snapshot.json', encoding='utf-8') as f:
    d = json.load(f)
objects = d.get('objects', [])
print(f'Total: {len(objects)}')
unique_ids = set([o['booliId'] for o in objects])
print(f'Unique: {len(unique_ids)}')
