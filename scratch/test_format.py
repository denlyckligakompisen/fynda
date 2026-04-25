
obj = {"address": "Test 1", "operatingCost": None, "plotArea": 100}
try:
    print(f"Drift {obj['operatingCost']:.0f}")
except Exception as e:
    print(f"Error: {e}")

obj["operatingCost"] = 0
print(f"Drift {obj['operatingCost']:.0f}")
