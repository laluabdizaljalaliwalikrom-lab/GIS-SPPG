import os
import sys

# Ensure backend root is in Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app import crud, models, schemas, dependencies
from fastapi import HTTPException

def test_roles_rbac():
    db = SessionLocal()
    try:
        print("--- TEST 1: Check Profile model sppg_id attribute ---")
        p = models.Profile(id="test_uuid_123", full_name="Test Nutrition Inspector", role="nutrition_inspector", sppg_id=1)
        assert hasattr(p, 'sppg_id'), "Profile model must have sppg_id column"
        print("-> SUCCESS: Profile model has sppg_id attribute!")

        print("\n--- TEST 2: Role Guard Dependency Checks ---")

        # 1. Admin Profile
        admin_p = models.Profile(id="admin_1", full_name="Admin Test", role="admin")
        assert dependencies.admin_only(admin_p).role == "admin"
        assert dependencies.coordinator_only(admin_p).role == "admin"
        assert dependencies.finance_only(admin_p).role == "admin"
        assert dependencies.nutrition_only(admin_p).role == "admin"
        assert dependencies.sppg_staff_only(admin_p).role == "admin"
        print("-> SUCCESS: Admin role passes all guard dependencies!")

        # 2. Finance Inspector Profile
        finance_p = models.Profile(id="fin_1", full_name="Finance Test", role="finance_inspector", sppg_id=5)
        assert dependencies.finance_only(finance_p).role == "finance_inspector"
        assert dependencies.sppg_staff_only(finance_p).role == "finance_inspector"
        
        # Test finance inspector restricted from admin_only & coordinator_only
        try:
            dependencies.coordinator_only(finance_p)
            assert False, "Finance inspector should be restricted from coordinator_only"
        except HTTPException as e:
            assert e.status_code == 403
            print("-> SUCCESS: Finance inspector correctly restricted from coordinator_only!")

        # 3. Nutrition Inspector Profile
        nutrition_p = models.Profile(id="nut_1", full_name="Nutrition Test", role="nutrition_inspector", sppg_id=5)
        assert dependencies.nutrition_only(nutrition_p).role == "nutrition_inspector"
        assert dependencies.sppg_staff_only(nutrition_p).role == "nutrition_inspector"
        
        # Test nutrition inspector restricted from finance_only
        try:
            dependencies.finance_only(nutrition_p)
            assert False, "Nutrition inspector should be restricted from finance_only"
        except HTTPException as e:
            assert e.status_code == 403
            print("-> SUCCESS: Nutrition inspector correctly restricted from finance_only!")

        # 4. SPPG Access Verification
        assert dependencies.verify_sppg_access(admin_p, 99) == True, "Admin has global SPPG access"
        assert dependencies.verify_sppg_access(finance_p, 5) == True, "Finance inspector has access to bound SPPG 5"
        
        try:
            dependencies.verify_sppg_access(finance_p, 99)
            assert False, "Finance inspector should be denied access to unbound SPPG 99"
        except HTTPException as e:
            assert e.status_code == 403
            print("-> SUCCESS: Bound role correctly denied access to unbound SPPG!")

        print("\n=== ALL RBAC & ROLE TESTS PASSED SUCCESSFULLY! ===")

    except Exception as e:
        print(f"TEST FAILED: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    test_roles_rbac()
