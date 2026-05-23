import requests, json, re
r = requests.get('https://www.booli.se/sok/till-salu?areaIds=386699,386690,386688,870600&maxListPrice=4000000&minRooms=3&upcomingSale=', headers={'User-Agent': 'Mozilla/5.0'})
m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', r.text, re.DOTALL)
d = json.loads(m.group(1))
root = d['props']['pageProps']['__APOLLO_STATE__']['ROOT_QUERY']
for k, v in root.items():
    if k.startswith('searchForSale') and isinstance(v, dict) and '__ref' in v:
        v = d['props']['pageProps']['__APOLLO_STATE__'][v['__ref']]
    if isinstance(v, dict) and 'totalCount' in v:
        print(f"Total count: {v['totalCount']} for {k}")
