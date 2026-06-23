import json
import glob
import re

f = glob.glob('booli_cache/*.json')[0]
data = json.load(open(f, encoding='utf-8'))
html = data['html']
match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
d = json.loads(match.group(1))

# Try looking at both apolloState and __APOLLO_STATE__
page_props = d.get('props', {}).get('pageProps', {})
props = page_props.get('__APOLLO_STATE__', page_props.get('apolloState', d.get('props', {}).get('__APOLLO_STATE__', {})))

keys = [k for k in props.keys() if k.startswith('Listing:')]
if keys:
    obj = props[keys[0]]
    print(json.dumps(obj, indent=2))
else:
    print("No listings found")
