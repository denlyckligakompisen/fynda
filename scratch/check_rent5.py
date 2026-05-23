import json, glob, re
found = False
for f in glob.glob('booli_cache/*.json'):
    c = json.load(open(f, encoding='utf-8'))
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', c['html'], re.DOTALL)
    if not m: continue
    d = json.loads(m.group(1))
    p = d.get('props',{}).get('pageProps',{}).get('__APOLLO_STATE__',{})
    obj = p.get('Listing:223843')
    if obj:
        print("FOUND 223843 in", f)
        pts = obj.get('displayAttributes', {}).get('dataPoints', [])
        print([pt.get('value', {}).get('plainText', '') if isinstance(pt, dict) else pt for pt in pts])
        print("RENT IS:", obj.get('rent'))
        found = True
        break
if not found:
    print("NOT FOUND")
