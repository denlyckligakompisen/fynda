import json
with open('booli_daily_snapshot.json', encoding='utf-8') as f:
    d = json.load(f)
objects = d.get('objects', [])
sold = [o for o in objects if o.get('isSold')]
print(f'Total: {len(objects)}')
print(f'Sold: {len(sold)}')
