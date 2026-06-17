import sys
import scraper
import os
import json
import subprocess

original_extract = scraper.extract_objects
stop_crawl = False

def new_extract(*args, **kwargs):
    global stop_crawl
    objects = original_extract(*args, **kwargs)
    for obj in objects:
        if obj.get("address") == "Ekensbergsvägen 63":
            print("FOUND Ekensbergsvägen 63! Setting stop flag.")
            stop_crawl = True
            break
    return objects

scraper.extract_objects = new_extract
original_fetch = scraper.fetch

def new_fetch(*args, **kwargs):
    if stop_crawl:
        return None, False
    return original_fetch(*args, **kwargs)

scraper.fetch = new_fetch

if __name__ == "__main__":
    target_url = "https://www.booli.se/sok/till-salu?areaIds=35,874689&maxListPrice=4500000&minRooms=3&upcomingSale="
    res = scraper.run([{"city": "Manual", "url": target_url}])
    
    with open("booli_daily_snapshot.json", "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    
    print("Running analyze.py...")
    subprocess.run(["python", "analyze.py", "booli_daily_snapshot.json"], check=True)
    print("Done!")
