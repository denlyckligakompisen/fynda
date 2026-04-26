import json

with open("booli_daily_snapshot.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    objs = data.get("objects", [])
    print(f"Total: {len(objs)}")
    with_lp = [o for o in objs if o.get("listPrice") is not None]
    with_ev = [o for o in objs if o.get("estimatedValue") is not None]
    with_both = [o for o in objs if o.get("listPrice") is not None and o.get("estimatedValue") is not None]
    print(f"With listPrice: {len(with_lp)}")
    print(f"With estimatedValue: {len(with_ev)}")
    print(f"With both: {len(with_both)}")
