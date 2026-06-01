import os, json, re
try:
    files = os.listdir('booli_cache')
    if not files:
        print("No files")
        exit()
    file_path = os.path.join('booli_cache', files[0])
    with open(file_path, 'r', encoding='utf-8') as f:
        html = json.load(f)['html']
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
    data = json.loads(m.group(1))
    apollo = data.get('props', {}).get('pageProps', {}).get('__APOLLO_STATE__', {})
    if not apollo:
        apollo = data.get('props', {}).get('__APOLLO_STATE__', {})
    
    keys = [k for k in apollo.keys() if k.startswith('Listing:') or k.startswith('Project:')]
    if keys:
        obj = apollo[keys[0]]
        print("KEYS:", list(obj.keys()))
        print("location:", obj.get("location"))
        print("region:", obj.get("region"))
        print("municipality:", obj.get("municipality"))
    else:
        print("No keys")
except Exception as e:
    import traceback
    traceback.print_exc()
