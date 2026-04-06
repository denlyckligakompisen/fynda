import json
import glob
import os

counts = {}
for f in glob.glob('booli_cache/*.json'):
    try:
        with open(f, 'r', encoding='utf-8', errors='ignore') as f_obj:
            d = json.load(f_obj)
            objs = d if isinstance(d, list) else d.get('objects', [])
            if not isinstance(objs, list): continue
            for o in objs:
                # If searchSource is missing, try to infer city
                s = o.get('searchSource')
                if not s:
                    addr = o.get('address', '')
                    if 'Stockholm' in addr or 'Solna' in addr or 'Bromma' in addr:
                        s = 'Stockholm'
                    elif 'Uppsala' in addr:
                        s = 'Uppsala'
                    else:
                        s = 'Unknown'
                counts[s] = counts.get(s, 0) + 1
    except:
        pass

print(json.dumps(counts, indent=2))
