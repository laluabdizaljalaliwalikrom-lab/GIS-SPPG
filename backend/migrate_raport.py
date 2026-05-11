import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load .env from root
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Migrating database...")
        try:
            conn.execute(text("ALTER TABLE sppg_units ADD COLUMN infrastruktur_score INTEGER DEFAULT 0"))
            print("Added infrastruktur_score")
        except Exception as e:
            print(f"infrastruktur_score already exists or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE sppg_units ADD COLUMN sdm_score INTEGER DEFAULT 0"))
            print("Added sdm_score")
        except Exception as e:
            print(f"sdm_score already exists or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE sppg_units ADD COLUMN kepuasan_score INTEGER DEFAULT 0"))
            print("Added kepuasan_score")
        except Exception as e:
            print(f"kepuasan_score already exists or error: {e}")
        
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
