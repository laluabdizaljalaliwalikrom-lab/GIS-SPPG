from app.database import SessionLocal
from app.models import RaportPoint

db = SessionLocal()
points = db.query(RaportPoint).order_by(RaportPoint.id).all()
print(f"Total points: {len(points)}")
for p in points:
    print(f"ID: {p.id} | Category: {p.category} | Text: {p.text}")
db.close()
