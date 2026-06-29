import json
import re

apollo = json.load(open('scraped_3307835.json', encoding='utf-8'))

# Try to extract location info from breadcrumbs since we didn't print them
area = "Smedjebacken"
address = "Skeppargatan 11"
try:
    if "showingsV2" in apollo and apollo["showingsV2"]:
        address = apollo["showingsV2"][0].get("title", "").split(",")[0]
except:
    pass

listPrice = apollo.get("listPrice", {}).get("raw", 0)
estimatedValue = apollo.get("estimate", {}).get("price", {}).get("raw", 0)
priceDiff = listPrice - estimatedValue if listPrice and estimatedValue else 0

obj = {
  "booliId": "3307835",
  "url": "https://www.booli.se/bostad/3307835",
  "address": address,
  "area": area,
  "listPrice": listPrice,
  "pageViews": 0,
  "daysActive": 0,
  "estimatedValue": estimatedValue,
  "priceDiff": priceDiff,
  "rooms": 4, # Fallback
  "livingArea": 117, # Fallback
  "rent": 0,
  "operatingCost": 0,
  "floor": apollo.get("floor"),
  "biddingOpen": apollo.get("biddingOpen", 0),
  "isNew": apollo.get("isNewConstruction", False),
  "upcomingSale": apollo.get("upcomingSale", False),
  "municipality": area,
  "brokerAgency": "Mäklarna Dalarna Bergslagen",
  "nextShowing": {"fullDateAndTime": "Sön 5 juli kl 11:00"},
  "published": apollo.get("published"),
  "latitude": apollo.get("showingsV2", [{}])[0].get("position", {}).get("latitude", 0),
  "longitude": apollo.get("showingsV2", [{}])[0].get("position", {}).get("longitude", 0),
  "sourcePage": "https://www.booli.se/bostad/3307835",
  "isSold": False,
  "imageUrl": "https://bcdn.se/images/cache/53683452_1170x0.jpg",
  "images": ["https://bcdn.se/images/cache/53683452_1170x0.jpg"],
  "objectType": "Villa",
  "tags": [],
  "searchSource": "Manual"
}

with open("booli_daily_snapshot.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# check if exists
if not any(o.get("booliId") == "3307835" for o in data.get("objects", [])):
    data["objects"].insert(0, obj)
    with open("booli_daily_snapshot.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Appended 3307835 to booli_daily_snapshot.json")
else:
    print("3307835 already exists")
