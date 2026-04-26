import json

with open("booli_daily_snapshot.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    urls = [o.get("url") for o in data.get("objects", [])]
    print(f"Total objects: {len(urls)}")
    print(f"Unique URLs: {len(set(urls))}")
    from collections import Counter
    c = Counter(urls)
    print(f"Most common: {c.most_common(5)}")
