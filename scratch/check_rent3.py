import json, glob, re
for f in glob.glob('booli_cache/*.json'):
    c = json.load(open(f, encoding='utf-8'))
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', c['html'], re.DOTALL)
    if not m: continue
    d = json.loads(m.group(1))
    p = d.get('props',{}).get('pageProps',{}).get('__APOLLO_STATE__',{})
    objs = [v for k,v in p.items() if (k.startswith('Listing:') or k.startswith('Project:') or k.startswith('SoldProperty:')) and str(v.get('booliId')) == '223843']
    if objs:
        print(json.dumps(objs[0], indent=2))
        break
