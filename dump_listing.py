
import json

try:
    with open("debug_next_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # find apollo state
    apollo = data.get("props", {}).get("pageProps", {}).get("__APOLLO_STATE__", {})
    if not apollo:
        print("No Apollo state found")
        exit()

    def resolve_deep(obj, visited=None):
        if visited is None: visited = set()
        
        # Prevent infinite recursion if circular refs exist (though unusual in Apollo state)
        if isinstance(obj, dict) and "__ref" in obj:
            ref = obj["__ref"]
            if ref in visited: return f"__CYCLE:{ref}__"
            visited.add(ref)
            res = resolve_deep(apollo.get(ref, {}), visited)
            visited.remove(ref)
            return res
            
        if isinstance(obj, list):
            return [resolve_deep(i, visited) for i in obj]
        if isinstance(obj, dict):
            return {k: resolve_deep(v, visited) for k, v in obj.items()}
        return obj

    all_dumps = []
    count = 0
    for key, value in apollo.items():
        if key.startswith("Listing:") and "displayAttributes" in value:
            print(f"Dumping {key}")
            full_obj = resolve_deep(value)
            all_dumps.append(full_obj)
            count += 1
            if count >= 5: break
    
    with open("multiple_listings_dump.json", "w", encoding="utf-8") as out:
        json.dump(all_dumps, out, indent=2, ensure_ascii=False)


except Exception as e:
    import traceback
    traceback.print_exc()
