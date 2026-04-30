import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv("../.env")
db_url = os.getenv("SUPABASE_DB_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
with engine.connect() as conn:
    res = conn.execute(text("SELECT count(*) FROM profiles"))
    count = res.scalar()
    print(f"Total profiles: {count}")

    res = conn.execute(text("SELECT id, full_name, role FROM profiles"))
    for row in res:
        print(row)
