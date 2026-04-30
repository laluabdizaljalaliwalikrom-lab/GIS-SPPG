
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func
import os
from dotenv import load_dotenv
from app import models

load_dotenv(r"c:\laragon\www\GIS-SPPG\.env")

SQLALCHEMY_DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif SQLALCHEMY_DATABASE_URL and "postgresql://" in SQLALCHEMY_DATABASE_URL and "+psycopg2" not in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://" , "postgresql+psycopg2://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_coordinates():
    db = SessionLocal()
    try:
        # Move them to Sikur, Lombok Timur area (~116.44)
        # We'll just shift the 115 to 116
        kelompoks = db.query(models.KelompokPenerima).all()
        for k in kelompoks:
            # We need to update the geom column
            # Current value was probably POINT(115.45 ...)
            # We want POINT(116.44 ...)
            
            # Let's just set them to a known good location in Sikur
            if k.nama == "TK PERTIWI SIKUR":
                new_lng, new_lat = 116.441, -8.631
            elif k.nama == "SD NEGERI 4 SIKUR":
                new_lng, new_lat = 116.438, -8.633
            else:
                continue
                
            geom_text = f"POINT({new_lng} {new_lat})"
            k.geom = func.ST_GeogFromText(geom_text)
            print(f"Updated {k.nama} to {new_lng}, {new_lat}")
            
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    fix_coordinates()
