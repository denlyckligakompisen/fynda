import json

file_path = 'src/listing_data.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for obj in data['objects']:
    if obj.get('address') == 'Kryddblandargatan 5':
        obj['estimatedValue'] = 3530000
        obj['priceDiff'] = obj['listPrice'] - obj['estimatedValue']
        if obj['estimatedValue'] > 0:
            obj['priceDiffPercent'] = round((obj['priceDiff'] / obj['estimatedValue']) * 100, 2)
        break

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

public_path = 'public/listing_data.json'
try:
    with open(public_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
except FileNotFoundError:
    pass

print("Updated estimated value")
