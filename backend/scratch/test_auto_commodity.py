import os
import sys

# Ensure backend root is in Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app import crud, models, schemas
from datetime import date

def test_auto_commodity_creation():
    db = SessionLocal()
    try:
        print("--- TEST 1: create_or_update_market_price with custom item ---")
        custom_item_1 = "Daging Bebek Custom Super"
        price_data = schemas.MarketPriceCreate(
            item_name=custom_item_1,
            reference_price=85000.0,
            unit="kg",
            shop_name="Pasar Sikur Utama",
            region_id="Sikur",
            price_date=date.today(),
            notes="Tes input barang custom acuan harga"
        )
        mp_res = crud.create_or_update_market_price(db, price_data)
        print(f"MarketPrice created ID: {mp_res.id}, item_name: {mp_res.item_name}, commodity_item_id: {mp_res.commodity_item_id}")
        
        # Verify CommodityItem
        comm_1 = db.query(models.CommodityItem).filter(models.CommodityItem.id == mp_res.commodity_item_id).first()
        assert comm_1 is not None, "CommodityItem should be auto-created for custom MarketPrice input"
        print(f"-> SUCCESS: Auto-created CommodityItem ID: {comm_1.id}, nama: '{comm_1.nama}', kategori: '{comm_1.kategori}', satuan: '{comm_1.satuan_default}'")

        print("\n--- TEST 2: submit_market_survey with custom item ---")
        custom_item_2 = "Telur Bebek Custom Organic"
        survey_data = schemas.MarketSurveyCreate(
            survey_session_id=f"TEST-SURVEY-{date.today()}",
            survey_date=date.today(),
            region_id="Sikur",
            shop_name="Toko Pangan Berkah",
            surveyor_name="Tester AI",
            items=[
                schemas.SurveyInputItem(
                    item_name=custom_item_2,
                    reference_price=3500.0,
                    unit="butir",
                    qty=10,
                    notes="Item custom dari survey pasar"
                )
            ]
        )
        survey_res = crud.submit_market_survey(db, survey_data)
        print(f"MarketSurvey submit result: {survey_res}")
        assert survey_res["success"] == 1, "Market survey should succeed"
        
        comm_2 = db.query(models.CommodityItem).filter(models.CommodityItem.nama.ilike(custom_item_2)).first()
        assert comm_2 is not None, "CommodityItem should be auto-created for custom MarketSurvey input"
        print(f"-> SUCCESS: Auto-created CommodityItem ID: {comm_2.id}, nama: '{comm_2.nama}', kategori: '{comm_2.kategori}', satuan: '{comm_2.satuan_default}'")

        print("\n--- TEST 3: create_audit_report with custom item ---")
        custom_item_3 = "Minyak Kelapa Custom Murni"
        extracted_items = [
            {
                "item_name": custom_item_3,
                "qty": 2.0,
                "price_per_unit": 22000.0,
                "unit": "liter"
            }
        ]
        audit_res = crud.create_audit_report(db, "http://example.com/test_doc.pdf", extracted_items)
        print(f"AuditReport created ID: {audit_res.id}, status: {audit_res.status}")
        
        comm_3 = db.query(models.CommodityItem).filter(models.CommodityItem.nama.ilike(custom_item_3)).first()
        assert comm_3 is not None, "CommodityItem should be auto-created for custom Smart Audit input"
        print(f"-> SUCCESS: Auto-created CommodityItem ID: {comm_3.id}, nama: '{comm_3.nama}', kategori: '{comm_3.kategori}', satuan: '{comm_3.satuan_default}'")
        
        # Verify default MarketPrice entry for Smart Audit custom item
        default_mp = db.query(models.MarketPrice).filter(models.MarketPrice.commodity_item_id == comm_3.id).first()
        assert default_mp is not None, "Default MarketPrice entry should be auto-created for Smart Audit custom item"
        print(f"-> SUCCESS: Auto-created default MarketPrice ID: {default_mp.id}, reference_price: {default_mp.reference_price}, shop: '{default_mp.shop_name}'")

        print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

        # Clean up test entries (delete referencing market prices & audit items first)
        db.query(models.MarketPrice).filter(models.MarketPrice.commodity_item_id.in_([c.id for c in [comm_1, comm_2, comm_3] if c])).delete(synchronize_session=False)
        db.delete(audit_res)
        if comm_1:
            db.delete(comm_1)
        if comm_2:
            db.delete(comm_2)
        if comm_3:
            db.delete(comm_3)
        db.commit()
        print("Cleanup completed cleanly.")
    except Exception as e:
        db.rollback()
        print(f"TEST FAILED with error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_auto_commodity_creation()
