import os
import json
import requests
from datetime import datetime

# Configuration
LISTING_DATA_PATH = 'src/listing_data.json'
SENT_LISTINGS_PATH = 'sent_listings.json'
DEAL_SCORE_THRESHOLD = 0.45

def load_env():
    """Simple env loader for BOT_TOKEN and CHAT_ID"""
    env_path = '.env'
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

def send_telegram_msg(token, chat_id, text):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Error sending Telegram message: {e}")
        return False

def format_listing_msg(item):
    price_diff = item.get('priceDiff', 0)
    deal_score = item.get('dealScore', 0)
    emoji = "🔥" if deal_score > 0.5 else "✨"
    
    msg = (
        f"{emoji} <b>NYTT FYND HITTAT!</b> {emoji}\n\n"
        f"📍 <b>{item.get('address', 'Adress saknas')}</b>\n"
        f"🏙 {item.get('area', '')}, {item.get('city', 'Stockholm')}\n\n"
        f"💰 Pris: {item.get('listPrice', 0):,} kr\n"
        f"📉 Under värdering: <b>{price_diff:,} kr</b>\n"
        f"📊 Deal Score: <b>{deal_score:.4f}</b>\n\n"
        f"🏠 {item.get('rooms', '?')} rum · {item.get('livingArea', '?')} m²\n"
        f"🔗 <a href='{item.get('url')}'>Visa på Booli</a>"
    )
    return msg

def main():
    load_env()
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    
    if not token or not chat_id:
        print("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env file.")
        return

    # Load data
    if not os.path.exists(LISTING_DATA_PATH):
        print(f"File not found: {LISTING_DATA_PATH}")
        return
        
    with open(LISTING_DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    listings = data.get('objects', [])
    
    # Load sent status
    sent_urls = set()
    if os.path.exists(SENT_LISTINGS_PATH):
        with open(SENT_LISTINGS_PATH, 'r') as f:
            sent_urls = set(json.load(f))
            
    new_sent_count = 0
    
    for item in listings:
        url = item.get('url')
        score = item.get('dealScore', 0)
        
        if url not in sent_urls and score >= DEAL_SCORE_THRESHOLD:
            print(f"New deal found! {item.get('address')} (Score: {score})")
            msg = format_listing_msg(item)
            if send_telegram_msg(token, chat_id, msg):
                sent_urls.add(url)
                new_sent_count += 1
                
    # Save sent status
    with open(SENT_LISTINGS_PATH, 'w') as f:
        json.dump(list(sent_urls), f)
        
    print(f"Done. Sent {new_sent_count} new alerts.")

if __name__ == "__main__":
    main()
