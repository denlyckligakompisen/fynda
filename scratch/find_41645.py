import json

with open('src/uppsala_market_trends.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Average of all '2' room values from 2024-01 onwards
prices_2 = [item['2'] for item in data['data'] if item['date'] >= '2024-01']
if prices_2:
    print(f"Avg 2-room since 2024-01: {sum(prices_2)/len(prices_2)}")

# Average of all room types in the latest month
latest = data['data'][-1]
latest_avg = (latest['1'] + latest['2'] + latest['3'] + latest['4']) / 4
print(f"Latest avg: {latest_avg}")

# Search for any combination that gives 41645
for item in data['data']:
    avg = (item['1'] + item['2'] + item['3'] + item['4']) / 4
    if abs(avg - 41645) < 100:
        print(f"Match found in {item['date']}: {avg}")
