from bs4 import BeautifulSoup
import re
import json

def parse_html(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()
        
    soup = BeautifulSoup(html, "html.parser")
    results = []
    
    # The list items seem to be <li class="standardbakgrund sv-search-hit ui-corner-all">
    hits = soup.select("li.sv-search-hit")
    
    print(f"Found {len(hits)} hits")
    
    for hit in hits:
        item = {}
        
        # 1. Image & encoded URL
        # The link ID seems to be dynamic, e.g. svlrid_3ce7668d7
        # <a href="/100507.html" class="h3rubrik" id="...">
        link = hit.select_one("a.h3rubrik")
        if link:
            item["url"] = "https://auktionstorget.kronofogden.se" + link.get("href")
            # Image is inside the a tag usually
            img = link.find("img")
            if img:
                item["imageUrl"] = "https://auktionstorget.kronofogden.se" + img.get("src")
                
        # 2. Title / Address
        # The second link often contains the text: "Edestad , Boahagavägen 2 , Johannishus"
        # Wait, there are multiple <a> tags with class h3rubrik?
        # Let's check structure again.
        # <div class="sv-visible-desktop">...<a ...><img ...></a></div>
        # <div class="sv-notopmargin sv-visible-desktop">...<a ...>Address</a></div>
        
        titles = hit.select("div.sv-visible-desktop a.h3rubrik")
        # Usually the second one is the text if the first is image?
        # Or look for the one with text content
        for t in titles:
            txt = t.get_text(strip=True)
            if txt:
                item["address"] = txt
                break
                
        # 3. Attributes
        # <p class="brodtextxfet">uppskattat värde: 700 000:-</p>
        # <p class="brodtextxfet">Auktion i Kalmar 2026-03-05</p>
        # <p class="brodtextxingress">Visning: 2026-02-26</p>
        
        paragraphs = hit.select("p")
        for p in paragraphs:
            txt = p.get_text(strip=True)
            
            if "Uppskattat värde:" in txt:
                val = txt.replace("Uppskattat värde:", "").replace(":-", "").replace(" ", "")
                # handle nbsp
                val = val.replace("\xa0", "")
                try: item["estimatedValue"] = int(val)
                except: pass
            
            elif "Auktion i" in txt:
                # "Auktion i Kalmar 2026-03-05"
                # Extract Date and possibly City
                match = re.search(r'Auktion i (.+?) (\d{4}-\d{2}-\d{2})', txt)
                if match:
                    item["city"] = match.group(1).strip()
                    item["auctionDate"] = match.group(2)
            
            elif "Visning:" in txt:
                 # "Visning: 2026-02-26"
                 match = re.search(r'Visning: (\d{4}-\d{2}-\d{2})', txt)
                 if match:
                     item["viewingDate"] = match.group(1)

        results.append(item)
        
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    parse_html("kronofogden_debug.html")
