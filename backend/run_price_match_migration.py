import os, time
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from app.database import engine
from sqlalchemy import text

sql = open(os.path.join(os.path.dirname(__file__), "create_smart_price_match.sql"), encoding="utf-8").read()

for attempt in range(3):
    try:
        with engine.begin() as conn:
            conn.execute(text(sql))
        print("MIGRATION OK")
        break
    except Exception as e:
        print(f"attempt {attempt+1} failed: {e}")
        time.sleep(3)
else:
    raise SystemExit("migration failed after retries")