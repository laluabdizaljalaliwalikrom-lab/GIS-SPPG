from app.database import SessionLocal
from app.models import KelompokPenerima

db = SessionLocal()
kelompoks = db.query(KelompokPenerima).all()
print("ID | Nama | Status")
print("-" * 30)
for k in kelompoks:
    print(f"{k.id} | {k.nama} | {k.status}")
db.close()
