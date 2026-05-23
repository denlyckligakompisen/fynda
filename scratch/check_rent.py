import json, glob, re
try:
    c = json.load(open(glob.glob('booli_cache/*.json')[0], encoding='utf-8'))
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', c['html'], re.DOTALL)
    d = json.loads(m.group(1))
    p = d.get('props',{}).get('pageProps',{}).get('__APOLLO_STATE__',{})
    objs = [v for k,v in p.items() if (k.startswith('Listing:') or k.startswith('Project:')) and v.get('rent')]
    print(json.dumps(objs[0] if objs else {}, indent=2))
except Exception as e:
    print(e)
