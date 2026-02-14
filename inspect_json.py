
import json

try:
    with open("debug_next_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # find apollo state
    apollo = data.get("props", {}).get("pageProps", {}).get("__APOLLO_STATE__", {})
    if not apollo:
        print("No Apollo state found")
        exit()

    print("\n--- Listing Attributes ---")
    count = 0
    for key, value in apollo.items():
        if key.startswith("Listing:"):
            print(f"Listing: {key}")
            # print(value.keys())
            
            # Check operating cost directly
            if "operatingCost" in value:
                 print(f"Found operatingCost: {value['operatingCost']}")
            
            # Dump all keys
            print(json.dumps(list(value.keys()), indent=2))
            
            # The structure is displayAttributes -> dataPoints (array of refs)
            da_ref = value.get("displayAttributes")
            da = da_ref
            if isinstance(da_ref, dict) and "__ref" in da_ref:
                da = apollo.get(da_ref["__ref"], {})
            
            if isinstance(da, dict) and "dataPoints" in da:
                points = da["dataPoints"]
                for p_ref in points:
                    if isinstance(p_ref, dict) and "__ref" in p_ref:
                        ref_key = p_ref["__ref"]
                        pt = apollo.get(ref_key, {})
                        
                        # Check header text if any (e.g. "Avgift", "Driftkostnad")
                        header_ref = pt.get("header")
                        header_text = ""
                        if isinstance(header_ref, dict) and "__ref" in header_ref:
                             h_obj = apollo.get(header_ref["__ref"], {})
                             header_text = h_obj.get("plainText")
                        
                        # pt has 'value' -> 'plainText' usually
                        val_ref = pt.get("value")
                        val_text = ""
                        if isinstance(val_ref, dict) and "__ref" in val_ref:
                             val_obj = apollo.get(val_ref["__ref"], {})
                             val_text = val_obj.get("plainText")
                        elif isinstance(val_ref, dict):
                             val_text = val_ref.get("plainText")
                        
            # Dump infoSections
            info_sections = value.get("infoSections")
            if isinstance(info_sections, list):
                print("  InfoSections:")
                for section_ref in info_sections:
                    if isinstance(section_ref, dict) and "__ref" in section_ref:
                        section = apollo.get(section_ref["__ref"], {})
                        content = section.get("content")
                        if isinstance(content, dict) and "__ref" in content:
                             content = apollo.get(content["__ref"], {})
                        
                        if isinstance(content, dict):
                            points = content.get("infoPoints", [])
                            for pt_ref in points:
                                if isinstance(pt_ref, dict) and "__ref" in pt_ref:
                                    pt = apollo.get(pt_ref["__ref"], {})
                                    key_name = pt.get("key")
                                    # print(f"    - Key: {key_name}")
                                    if key_name == "operatingCost" or key_name == "driftkostnad" or "drift" in str(key_name).lower():
                                         print(f"    FOUND DRIFT: {pt}")
                                    
                                    # Check display text
                                    disp = pt.get("displayText")
                                    if isinstance(disp, dict) and "__ref" in disp:
                                         disp = apollo.get(disp["__ref"], {})
                                    
                                    if isinstance(disp, dict):
                                         md = disp.get("markdown")
                                         if md and "drift" in md.lower():
                                              print(f"    Found drift in markdown: {md}")

            count += 1
            if count >= 3: break

except Exception as e:
    import traceback
    traceback.print_exc()
