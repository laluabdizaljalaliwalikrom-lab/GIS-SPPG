import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

# Supabase connection string usually looks like:
# postgresql://postgres:[password]@[db-host]:5432/postgres
# For SQLAlchemy, we ensure it uses psycopg2
DATABASE_URL = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL", "postgresql+psycopg2://sppg_user:sppg_password@db:5432/sppg_db")

# If the URL starts with postgres:// (Supabase style), replace it with postgresql:// for SQLAlchemy compatibility
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL and "postgresql://" in DATABASE_URL and "+psycopg2" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
