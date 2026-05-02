import json

with open('src/listing_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

prices = [obj['pricePerSqm'] for obj in data['objects'] if obj.get('pricePerSqm') and 'Uppsala' in (obj.get('searchSource') or '')]
if prices:
    avg = sum(prices) / len(prices)
    print(f"Average price per sqm (Uppsala): {avg}")
    print(f"Count: {len(prices)}")
else:
    print("No prices found")
