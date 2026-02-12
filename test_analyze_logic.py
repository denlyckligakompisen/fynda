from datetime import datetime
import json

def test_logic():
    # Listing published today at 08:53
    pub_str = "2026-02-12 08:53:55"
    pub_date = datetime.strptime(pub_str, "%Y-%m-%d %H:%M:%S")
    
    # Current time simulation
    now = datetime(2026, 2, 12, 23, 9, 14)
    
    diff = now - pub_date
    print(f"Now: {now}")
    print(f"Pub: {pub_date}")
    print(f"Diff: {diff}")
    print(f"Diff Days: {diff.days}")
    
    # Simulate analyze.py's normalize_object logic
    days_active = 0 # scraper says 0
    if days_active == 0 and pub_str:
        days_active = max(0, (now - pub_date).days)
    
    print(f"Calculated Days Active: {days_active}")
    
    # If now was Feb 14 (due to some clock issue)
    now_future = datetime(2026, 2, 14, 23, 9, 14)
    days_active_future = max(0, (now_future - pub_date).days)
    print(f"Calculated Days Active (if now was Feb 14): {days_active_future}")

if __name__ == "__main__":
    test_logic()
