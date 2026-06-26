import json
import os

with open("src/listing_data.json", "r", encoding="utf-8") as f:
    gui_data = json.load(f)

# The new listing object
new_listing = {
    "url": "https://www.booli.se/bostad/244663",
    "address": "Kungsängsgatan 57E",
    "area": "Kungsängen",
    "city": "Uppsala",
    "listPrice": 2395000,
    "soldPrice": None,
    "pageViews": 115,
    "estimatedValue": 2730000,
    "priceDiff": 2395000 - 2730000,
    "priceDiffPercent": round((2395000 - 2730000) / 2730000 * 100, 2),
    "pricePerSqm": round(2395000 / 75, 2),
    "rooms": 3.0,
    "livingArea": 75.0,
    "rent": 5813,
    "floor": 2,
    "biddingOpen": 0,
    "nextShowing": {
        "fullDateAndTime": "Sön 5 juli kl 13:00"
    },
    "published": "2026-06-25 16:00:07",
    "latitude": 59.850914,
    "longitude": 17.653885,
    "sourcePage": "https://www.booli.se/bostad/244663",
    "searchSource": "Uppsala",
    "daysActive": 1,
    "isSold": False,
    "imageUrl": "https://bcdn.se/images/cache/54457016_1170x0.jpg",
    "images": [
        "https://bcdn.se/images/cache/54457016_1170x0.jpg",
        "https://bcdn.se/images/cache/54457017_1170x0.jpg",
        "https://bcdn.se/images/cache/54457018_1170x0.jpg",
        "https://bcdn.se/images/cache/54457019_1170x0.jpg",
        "https://bcdn.se/images/cache/54457020_1170x0.jpg"
    ],
    "objectType": "Lägenhet",
    "operatingCost": 450,
    "brokerAgency": "Widerlöv",
    "isNew": True,
    "isRecentlyPublished": True,
    "hasViewing": True,
    "pageViewsPerDay": 115,
    "booliId": "6178869"
}

# Check if already added
if not any(obj.get("booliId") == "6178869" for obj in gui_data["objects"]):
    gui_data["objects"].insert(0, new_listing)
    gui_data["rankings"]["bestDealsByDiff"].append(new_listing)
    gui_data["rankings"]["bestDealsByDiff"].sort(key=lambda x: x["priceDiff"])

    with open("src/listing_data.json", "w", encoding="utf-8") as f:
        json.dump(gui_data, f, indent=2, ensure_ascii=False)

    with open("public/listing_data.json", "w", encoding="utf-8") as f:
        json.dump(gui_data, f, indent=2, ensure_ascii=False)

    print("Listing added to GUI data successfully.")
else:
    print("Listing already exists in GUI data.")
