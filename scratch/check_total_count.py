import json, glob, re
for f in glob.glob('booli_cache/*.json'):
    c = json.load(open(f, encoding='utf-8'))
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', c['html'], re.DOTALL)
    if not m: continue
    d = json.loads(m.group(1))
    apollo = d.get('props',{}).get('pageProps',{}).get('__APOLLO_STATE__',{})
    root = apollo.get('ROOT_QUERY', {})
    for k, v in root.items():
        if k.startswith('searchForSale') or k.startswith('searchNyproduktion'):
            search_data = v
            if isinstance(v, dict) and '__ref' in v:
                search_data = apollo.get(v['__ref'], {})
            print(f"File {f}: Found {k} with totalCount {search_data.get('totalCount')}")
