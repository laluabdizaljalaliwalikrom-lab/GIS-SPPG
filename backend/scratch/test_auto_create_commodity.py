from app.database import SessionLocal
from app.schemas import MarketSurveyCreate, SurveyInputItem
from app.crud import submit_market_survey, get_commodity_items
from datetime import date

db = SessionLocal()

custom_survey = MarketSurveyCreate(
    survey_session_id=f"TEST-AUTO-{date.today()}",
    survey_date=date.today(),
    region_id="Sikur",
    shop_name="Pasar Tradisional Test",
    surveyor_name="Petugas Test",
    items=[
        SurveyInputItem(
            commodity_item_id=None,
            item_name="Kacang Mede Super",
            reference_price=125000.0,
            unit="kg",
            qty=1.0,
            notes="Barang custom baru"
        )
    ]
)

res = submit_market_survey(db, custom_survey)
print("Survey submission result:", res)

# Check if 'Kacang Mede Super' was added to master commodity_items
master_items = get_commodity_items(db, limit=100)
matched = [i for i in master_items if i.nama == "Kacang Mede Super"]
if matched:
    print(f"SUCCESS! Master item auto-created: ID={matched[0].id}, Nama='{matched[0].nama}', Satuan='{matched[0].satuan_default}', Deskripsi='{matched[0].deskripsi}'")
else:
    print("FAILED: Master item was not auto-created.")

db.close()
