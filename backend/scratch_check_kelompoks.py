
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from app import models, crud

load_dotenv(r"c:\laragon\www\GIS-SPPG\.env")

SQLALCHEMY_DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif SQLALCHEMY_DATABASE_URL and "postgresql://" in SQLALCHEMY_DATABASE_URL and "+psycopg2" not in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_kelompoks():
    db = SessionLocal()
    try:
        kelompoks = crud.get_kelompoks(db)
        print(f"Found {len(kelompoks)} kelompoks")
        for k in kelompoks:
            print(f"ID: {k.id}, Nama: {k.nama}, Status: {k.status}, Lat: {k.lat}, Lng: {k.lng}")
    finally:
        db.close()

if __name__ == "__main__":
    check_kelompoks()
