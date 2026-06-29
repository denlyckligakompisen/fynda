import json
with open('temp_apollo_state.json', 'r', encoding='utf-8') as f:
    state = json.load(f)

# Find the object of type Listing or Object
target_obj = None
for key, val in state.items():
    if val.get('__typename') == 'Listing':
        target_obj = val
        break

if not target_obj:
    print('No listing found in apollo state')
    exit(1)

# Function to safely extract values from nested dictionaries
def get_val(obj, path, default=None):
    if not obj:
        return default
    keys = path.split('.')
    current = obj
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        elif isinstance(current, list) and key.isdigit():
            idx = int(key)
            if idx < len(current):
                current = current[idx]
            else:
                return default
        else:
            return default
    return current

# Extract the listing data according to our schema
def get_ref(ref_obj):
    if isinstance(ref_obj, dict) and '__ref' in ref_obj:
        return state.get(ref_obj['__ref'])
    return ref_obj

booli_id = target_obj.get('booliId')
location = get_ref(target_obj.get('location'))
address = get_ref(location.get('address')) if location else None
position = get_ref(location.get('position')) if location else None
region = get_ref(location.get('region')) if location else None

listPrice = get_ref(target_obj.get('listPrice'))
rent = get_ref(target_obj.get('rent'))

showings = get_ref(target_obj.get('showings'))
nextShowing = None
if showings and isinstance(showings, list) and len(showings) > 0:
    first_showing = get_ref(showings[0])
    if first_showing:
        nextShowing = {
            'date': first_showing.get('date'),
            'startTime': first_showing.get('startTime'),
            'endTime': first_showing.get('endTime')
        }

primary_image_ref = get_ref(target_obj.get('primaryImage'))
image_url = primary_image_ref.get('url') if primary_image_ref else None

listing_data = {
    'booliId': booli_id,
    'address': address.get('streetAddress') if address else '',
    'listPrice': listPrice.get('amount') if listPrice else 0,
    'rent': rent.get('amount') if rent else 0,
    'livingArea': target_obj.get('livingArea'),
    'rooms': target_obj.get('rooms'),
    'floor': target_obj.get('floor'),
    'published': target_obj.get('publishedAt'),
    'biddingOpen': 1 if target_obj.get('isBiddingOngoing') else 0,
    'municipality': region.get('municipalityName') if region else '',
    'url': image_url,
    'longitude': position.get('longitude') if position else 0,
    'latitude': position.get('latitude') if position else 0,
    'nextShowing': nextShowing,
    'images': [],
    'objectType': target_obj.get('objectType', 'Lägenhet')
}

# Add images
media_list = get_ref(target_obj.get('media'))
if media_list and isinstance(media_list, list):
    for m_ref in media_list:
        m = get_ref(m_ref)
        if m and m.get('__typename') == 'Image':
            listing_data['images'].append(m.get('url'))

# Load existing snapshots
with open('booli_daily_snapshot.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

# Find if it exists and update, or append
found = False
for i, item in enumerate(db):
    if str(item.get('booliId')) == str(booli_id):
        db[i].update(listing_data)
        found = True
        break

if not found:
    db.append(listing_data)

with open('booli_daily_snapshot.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print(f'Successfully added/updated {listing_data["address"]} in snapshot')
