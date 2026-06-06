import json, re, os

cache_dir = "booli_cache"
f = os.listdir(cache_dir)[0]
path = os.path.join(cache_dir, f)
data = json.load(open(path, "r", encoding="utf-8"))
html = data.get("html", "")

# Let's just find ALL occurrences of "Showing" or fullDateAndTime
print(f"File: {f}")
dates = re.findall(r'"fullDateAndTime":"([^"]+)"', html)
print(f"Found {len(dates)} fullDateAndTime matches")
print(dates[:10])

showings = re.findall(r'"showing[^"]*":({[^}]+})', html, re.IGNORECASE)
print(f"\nFound {len(showings)} showing fields")
print(showings[:5])

# Search for the Siktargatan 14 booliId 244630
if "244630" in html:
    print("\nFound booliId 244630 in HTML!")
    # get context around it
    idx = html.find("244630")
    print(html[max(0, idx-100):min(len(html), idx+300)])
