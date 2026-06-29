import json
with open('next_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

apollo = data.get('props', {}).get('pageProps', {}).get('__APOLLO_STATE__', {})
target_obj = None
for key, val in apollo.items():
    if val.get('__typename') == 'Listing':
        target_obj = val
        break

if not target_obj:
    print('No listing found in apollo state')
    exit(1)

def get_raw(val):
    if isinstance(val, dict) and 'raw' in val:
        return val['raw']
    return val

booli_id = target_obj.get('booliId')
address = target_obj.get('streetAddress')
latitude = target_obj.get('latitude', 0)
longitude = target_obj.get('longitude', 0)
listPrice = get_raw(target_obj.get('listPrice'))
rent = get_raw(target_obj.get('rent'))
livingArea = get_raw(target_obj.get('livingArea'))
rooms = get_raw(target_obj.get('rooms'))
floor = get_raw(target_obj.get('floor'))
published = target_obj.get('published')
biddingOpen = 1 if target_obj.get('biddingOpen') else 0
municipality = target_obj.get('location', {}).get('region', {}).get('municipalityName', '')
url = target_obj.get('listingUrl') or target_obj.get('url')

nextShowing = None
showings = target_obj.get('showingsV2', [])
if showings and isinstance(showings, list) and len(showings) > 0:
    first = showings[0]
    nextShowing = {
        'date': first.get('date'),
        'startTime': first.get('startTime'),
        'endTime': first.get('endTime')
    }

listing_data = {
    'booliId': booli_id,
    'address': address,
    'listPrice': listPrice,
    'rent': rent,
    'livingArea': livingArea,
    'rooms': rooms,
    'floor': floor,
    'published': published,
    'biddingOpen': biddingOpen,
    'municipality': municipality,
    'url': url,
    'longitude': longitude,
    'latitude': latitude,
    'nextShowing': nextShowing,
    'images': [],
    'objectType': target_obj.get('objectType', 'Lägenhet')
}

images = target_obj.get('images', [])
for img_ref in images:
    if isinstance(img_ref, dict) and '__ref' in img_ref:
        img_obj = apollo.get(img_ref['__ref'])
        if img_obj and img_obj.get('url'):
            listing_data['images'].append(img_obj.get('url'))

if len(listing_data['images']) > 0:
    listing_data['imageUrl'] = listing_data['images'][0]

# Load existing snapshots
with open('booli_daily_snapshot.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

found = False
if 'objects' in db and isinstance(db['objects'], list):
    for i, item in enumerate(db['objects']):
        if str(item.get('booliId')) == str(booli_id):
            db['objects'][i].update(listing_data)
            found = True
            break
    if not found:
        db['objects'].append(listing_data)
else:
    print("db is not an array and doesn't have an 'objects' array")

with open('booli_daily_snapshot.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print(f'Successfully added/updated {listing_data["address"]} in snapshot')
