from app.database import SessionLocal
from app.models import MarketPrice, CommodityItem
from sqlalchemy import func

db = SessionLocal()

print("=== COMMODITY ITEMS ===")
items = db.query(CommodityItem).all()
print(f"Total commodity items: {len(items)}")
for item in items[:10]:
    print(f"ID: {item.id} | Nama: {item.nama} | Kategori: {item.kategori} | Satuan: {item.satuan_default}")

print("\n=== MARKET PRICES ===")
prices = db.query(MarketPrice).all()
print(f"Total market prices: {len(prices)}")
for p in prices[:10]:
    print(f"ID: {p.id} | Item: {p.item_name} | Price: {p.reference_price} | Toko: {p.shop_name} | Session: {p.survey_session_id}")

print("\n=== SURVEY SESSIONS ===")
sessions = db.query(
    MarketPrice.survey_session_id,
    func.max(MarketPrice.shop_name).label('shop_name'),
    func.max(MarketPrice.region_id).label('region_id'),
    func.max(MarketPrice.price_date).label('price_date'),
    func.max(MarketPrice.surveyor_name).label('surveyor_name'),
    func.count(MarketPrice.id).label('item_count'),
    func.sum(MarketPrice.reference_price).label('total_value')
).filter(MarketPrice.survey_session_id.isnot(None)).group_by(MarketPrice.survey_session_id).all()

print(f"Total survey sessions: {len(sessions)}")
for s in sessions:
    print(f"Session: {s.survey_session_id} | Toko: {s.shop_name} | Items: {s.item_count} | Total: {s.total_value}")

db.close()
