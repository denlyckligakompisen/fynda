import json, glob, re
for f in glob.glob('booli_cache/*.json'):
    c = json.load(open(f, encoding='utf-8'))
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', c['html'], re.DOTALL)
    if not m: continue
    d = json.loads(m.group(1))
    apollo = d.get('props',{}).get('pageProps',{}).get('__APOLLO_STATE__',{})
    obj = apollo.get('Listing:6110543')
    if obj:
        print(json.dumps(obj, indent=2))
        break
