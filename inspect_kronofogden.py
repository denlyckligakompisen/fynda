import requests
import json
import re

url = "https://auktionstorget.kronofogden.se/Sokfastigheterbostadsratter.html?query=*"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

try:
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    
    html = response.text
    
    # Save HTML for manual inspection
    with open("kronofogden_debug.html", "w", encoding="utf-8") as f:
        f.write(html)
        
    print(f"Saved HTML to kronofogden_debug.html ({len(html)} bytes)")

    # specific search for API-like URLs
    api_patterns = [
        r'fetch\(["\']([^"\']+)["\']',
        r'\.get\(["\']([^"\']+)["\']',
        r'\.post\(["\']([^"\']+)["\']',
        r'url:\s*["\']([^"\']+)["\']',
        r'["\'](https://auktionstorget\.kronofogden\.se/[^"\']+)["\']'
    ]
    
    found_urls = set()
    for pattern in api_patterns:
        matches = re.finditer(pattern, html)
        for match in matches:
            found_urls.add(match.group(1))
            
    if found_urls:
        print("\nPossible API endpoints found:")
        for u in sorted(found_urls):
            print(f" - {u}")
    else:
        print("\nNo obvious API endpoints found in initial HTML.")

except Exception as e:
    print(f"Error: {e}")
