import sys
sys.path.append('c:\\dev\\fynda')
import json, glob, re
from scraper import resolve

for f in glob.glob('booli_cache/*.json'):
    c = json.load(open(f, encoding='utf-8'))
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', c['html'], re.DOTALL)
    if not m: continue
    d = json.loads(m.group(1))
    apollo = d.get('props',{}).get('pageProps',{}).get('__APOLLO_STATE__',{})
    objs = [v for k,v in apollo.items() if (k.startswith('Listing:') or k.startswith('Project:'))]
    for obj in objs:
        rent = None
        # obj is NOT resolved yet!
        # wait, scraper.py resolves obj first:
        obj = resolve(obj, apollo)
        display_attrs = obj.get("displayAttributes")
        if isinstance(display_attrs, dict):
            points = display_attrs.get("dataPoints", [])
            for pt in points:
                 pt = resolve(pt, apollo)
                 val_obj = pt.get("value", {})
                 txt = val_obj.get("plainText", "")
                 lower_txt = txt.lower()
                 if (("kr/mån" in lower_txt or "avgift" in lower_txt) and "kr/m²" not in lower_txt and "m2" not in lower_txt) and not rent:
                     match = re.search(r'([\d\s]+)\s*kr/mån', txt, re.IGNORECASE)
                     if match:
                         digits = "".join(c for c in match.group(1) if c.isdigit())
                         if digits:
                             try:
                                 rent = int(digits)
                             except ValueError: pass
        if 'l\u00e4genhet' in str(obj.get('objectType', '')).lower() and rent is not None:
            print("SUCCESS RENT:", rent, "FOR URL:", obj.get("url"))
            break
