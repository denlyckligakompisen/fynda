import json
with open("booli_daily_snapshot.json", "r", encoding="utf-8") as f:
    data = json.load(f)

objs = data.get("objects", [])
has_img = [o for o in objs if o.get("imageUrl")]
print(f"Total objects: {len(objs)}")
print(f"Objects with imageUrl: {len(has_img)}")
if has_img:
    print(f"Sample: {has_img[0]['imageUrl']} for {has_img[0]['url']}")
