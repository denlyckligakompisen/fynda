import sys
import traceback

try:
    print("Attempting to import analyze...")
    import analyze
    print("Import successful.")
except Exception:
    traceback.print_exc()
    sys.exit(1)

print("Running analyze.run()...")
try:
    analyze.run()
    print("Run successful.")
except Exception:
    traceback.print_exc()
