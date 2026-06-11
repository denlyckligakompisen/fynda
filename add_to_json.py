import json

file_path = 'src/listing_data.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

new_property = {
  "url": "https://www.booli.se/bostad/4201424",
  "address": "Kryddblandargatan 5",
  "area": "Industristaden",
  "city": "Uppsala",
  "listPrice": 3295000,
  "soldPrice": None,
  "pageViews": 8,
  "estimatedValue": 3295000,
  "priceDiff": 0,
  "rooms": 3.0,
  "livingArea": 81.0,
  "rent": 4920,
  "floor": 6,
  "biddingOpen": 0,
  "nextShowing": None,
  "published": "2026-06-11 00:00:00",
  "latitude": None,
  "longitude": None,
  "sourcePage": "https://www.booli.se/bostad/4201424",
  "searchSource": "Manual",
  "daysActive": 0,
  "isSold": False,
  "imageUrl": None,
  "images": [],
  "totalFloors": 7,
  "objectType": "Lägenhet",
  "operatingCost": 129.0,
  "constructionYear": 2019,
  "brfName": None,
  "brfApartments": None,
  "brfOrgNumber": None,
  "brfDebtSqm": None,
  "brfOwnsLand": None,
  "tags": [],
  "secondaryArea": None,
  "plotArea": None,
  "apartmentNumber": "1602",
  "brokerAgency": "Mäklarhuset",
  "energyClass": "B",
  "isNew": None,
  "upcomingSale": True,
  "tenure": "Bostadsrätt",
  "municipality": "Uppsala",
  "county": None,
  "mortgageDeeds": None,
  "booliId": "4201424",
  "priceDiffPercent": 0,
  "pricePerSqm": 40679.01,
  "isRecentlyPublished": True,
  "hasViewing": False,
  "pageViewsPerDay": 8
}

data['objects'].insert(0, new_property)

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

public_path = 'public/listing_data.json'
try:
    with open(public_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
except FileNotFoundError:
    pass

print("Added to json")
