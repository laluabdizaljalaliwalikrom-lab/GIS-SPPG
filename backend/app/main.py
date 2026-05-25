from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import engine, get_db
from .dependencies import coordinator_only, admin_only
import logging
import os
import pandas as pd
import io
from dotenv import load_dotenv

# Load .env from root
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SPPG Mapping System API")

# Ensure static uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../static/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../static")), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/sppg", response_model=list[schemas.SPPGUnitResponse])
def read_sppgs(skip: int = 0, limit: int = 100, name: str = None, db: Session = Depends(get_db)):
    return crud.get_sppgs(db, skip=skip, limit=limit, name=name)

@app.post("/api/sppg", response_model=schemas.SPPGUnitResponse)
def create_sppg(sppg: schemas.SPPGUnitCreate, db: Session = Depends(get_db), _ = Depends(coordinator_only)):
    db_sppg = crud.create_sppg(db, sppg)
    # Re-fetch with parsed lat/lng
    sppgs = crud.get_sppgs(db)
    for s in sppgs:
        if s.id == db_sppg.id:
            return s
    raise HTTPException(status_code=500, detail="Failed to fetch created SPPG")

@app.post("/api/sppg/import")
async def import_sppg_file(file: UploadFile = File(...), db: Session = Depends(get_db), _ = Depends(coordinator_only)):
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Standardize column names to lowercase
        df.columns = [c.lower() for c in df.columns]
        data = df.to_dict(orient='records')
        return crud.import_sppgs(db, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memproses file: {str(e)}")

@app.get("/api/kelompok", response_model=list[schemas.KelompokPenerimaResponse])
def read_kelompoks(skip: int = 0, limit: int = 100, name: str = None, status: str = None, type: str = None, db: Session = Depends(get_db)):
    return crud.get_kelompoks(db, skip=skip, limit=limit, name=name, status=status, type=type)

@app.post("/api/kelompok", response_model=schemas.KelompokPenerimaResponse)
def create_kelompok(kelompok: schemas.KelompokPenerimaCreate, db: Session = Depends(get_db), current_user: models.Profile = Depends(coordinator_only)):
    db_k = crud.create_kelompok(db, kelompok, current_user)
    # Re-fetch
    kelompoks = crud.get_kelompoks(db)
    for k in kelompoks:
        if k.id == db_k.id:
            return k
    raise HTTPException(status_code=500, detail="Failed to fetch created Kelompok")

@app.post("/api/kelompok/import")
async def import_kelompok_file(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.Profile = Depends(coordinator_only)):
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Standardize column names to lowercase
        df.columns = [c.lower() for c in df.columns]
        data = df.to_dict(orient='records')
        return crud.import_kelompoks(db, data, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memproses file: {str(e)}")

@app.put("/api/sppg/{sppg_id}", response_model=schemas.SPPGUnitResponse)
def update_sppg(sppg_id: int, sppg: schemas.SPPGUnitCreate, db: Session = Depends(get_db), _ = Depends(coordinator_only)):
    return crud.update_sppg(db, sppg_id, sppg)

@app.delete("/api/sppg/{sppg_id}")
def delete_sppg(sppg_id: int, db: Session = Depends(get_db), _ = Depends(admin_only)):
    crud.delete_sppg(db, sppg_id)
    return {"status": "success"}

@app.put("/api/kelompok/{kelompok_id}", response_model=schemas.KelompokPenerimaResponse)
def update_kelompok(kelompok_id: int, kelompok: schemas.KelompokPenerimaCreate, db: Session = Depends(get_db), _ = Depends(coordinator_only)):
    return crud.update_kelompok(db, kelompok_id, kelompok)

@app.delete("/api/kelompok/{kelompok_id}")
def delete_kelompok(kelompok_id: int, db: Session = Depends(get_db), _ = Depends(admin_only)):
    crud.delete_kelompok(db, kelompok_id)
    return {"status": "success"}

@app.post("/api/kelompok/{id}/verify")
def verify_kelompok(id: int, req: dict, db: Session = Depends(get_db), current_user: models.Profile = Depends(coordinator_only)):
    status = req.get("status")
    return crud.verify_kelompok(db, id, status)

@app.patch("/api/kelompok/{id}/assign")
def assign_manual(id: int, req: dict, db: Session = Depends(get_db), current_user: models.Profile = Depends(coordinator_only)):
    sppg_id = req.get("sppg_id")
    assign_req = schemas.ManualAssignRequest(group_id=id, sppg_id=sppg_id)
    return crud.assign_manual(db, assign_req)

@app.post("/api/allocate")
def allocate_automatic(db: Session = Depends(get_db)):
    return crud.allocate_automatic(db)

@app.get("/api/users", response_model=list[schemas.ProfileResponse])
def read_users(db: Session = Depends(get_db)):
    return crud.get_users(db)

@app.post("/api/users", response_model=schemas.ProfileResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_user(db, user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/users/{user_id}", response_model=schemas.ProfileResponse)
def update_user(user_id: str, profile: schemas.ProfileBase, db: Session = Depends(get_db)):
    return crud.update_user(db, user_id, profile)

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    crud.delete_user(db, user_id)
    return {"status": "success"}

# Raport Points API
@app.get("/api/raport-points", response_model=List[schemas.RaportPointResponse])
def get_raport_points(db: Session = Depends(get_db)):
    return crud.get_raport_points(db)

@app.post("/api/raport-points", response_model=schemas.RaportPointResponse)
def create_raport_point(point: schemas.RaportPointCreate, db: Session = Depends(get_db), _ = Depends(admin_only)):
    return crud.create_raport_point(db, point)

@app.delete("/api/raport-points/{point_id}")
def delete_raport_point(point_id: int, db: Session = Depends(get_db), _ = Depends(admin_only)):
    crud.delete_raport_point(db, point_id)
    return {"status": "success"}

# SPPG Checklist API
@app.get("/api/sppg/{sppg_id}/checklist", response_model=List[schemas.SPPGPointAnswerResponse])
def get_sppg_checklist(sppg_id: int, db: Session = Depends(get_db)):
    return crud.get_sppg_answers(db, sppg_id)

@app.put("/api/sppg/{sppg_id}/checklist")
def update_sppg_checklist(sppg_id: int, checklist: schemas.SPPGChecklistUpdate, db: Session = Depends(get_db), _ = Depends(coordinator_only)):
    return crud.update_sppg_checklist(db, sppg_id, checklist)


# --- SMART AUDIT & POTENTIAL LOSS DETECTION ENDPOINTS ---

@app.post("/api/audit/upload", response_model=schemas.AuditReportDetailResponse)
async def upload_audit_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(coordinator_only)
):
    try:
        contents = await file.read()
        
        # 1. Try uploading to Supabase Storage
        doc_url = None
        bucket_name = "audit_documents"
        
        if crud.supabase:
            try:
                # Ensure bucket exists
                try:
                    crud.supabase.storage.create_bucket(bucket_name, options={"public": True})
                except Exception:
                    pass
                
                import uuid
                ext = file.filename.split(".")[-1]
                unique_filename = f"{uuid.uuid4()}.{ext}"
                
                # Upload to Supabase bucket
                crud.supabase.storage.from_(bucket_name).upload(
                    path=unique_filename,
                    file=contents,
                    file_options={"content-type": file.content_type}
                )
                
                # Get public URL
                doc_url = crud.supabase.storage.from_(bucket_name).get_public_url(unique_filename)
            except Exception as e:
                # If Supabase fails, log it and fall back to local serving
                print(f"Supabase Storage upload warning: {e}")
                
        # 2. Local Fallback Storage
        if not doc_url:
            import uuid
            ext = file.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{ext}"
            local_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            with open(local_path, "wb") as f_out:
                f_out.write(contents)
                
            doc_url = f"/static/uploads/{unique_filename}"
            
        # 3. OCR scanning (Gemini + Local Fallback)
        from .ocr import perform_ocr
        extracted_items = perform_ocr(contents, file.filename, file.content_type)
        
        if not extracted_items:
            raise HTTPException(status_code=400, detail="Gagal mengekstrak item dari dokumen. Silakan periksa format dokumen.")
            
        # 4. Save to database & record in audit trail logs
        db_report = crud.create_audit_report(db, doc_url, extracted_items, current_user.id)
        return db_report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses file audit: {str(e)}")

@app.get("/api/audit/reports", response_model=List[schemas.AuditReportResponse])
def read_audit_reports(db: Session = Depends(get_db), current_user: models.Profile = Depends(coordinator_only)):
    return crud.get_audit_reports(db)

@app.get("/api/audit/reports/{id}", response_model=schemas.AuditReportDetailResponse)
def read_audit_report_detail(id: int, db: Session = Depends(get_db), current_user: models.Profile = Depends(coordinator_only)):
    report = crud.get_audit_report(db, id)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    return report

@app.delete("/api/audit/reports/{id}")
def delete_audit_report(id: int, db: Session = Depends(get_db), current_user: models.Profile = Depends(admin_only)):
    success = crud.delete_audit_report(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    return {"status": "success", "message": f"Berhasil menghapus laporan audit ID {id}"}

@app.get("/api/audit/market-prices", response_model=List[schemas.MarketPriceResponse])
def read_market_prices(db: Session = Depends(get_db), current_user: models.Profile = Depends(coordinator_only)):
    return crud.get_market_prices(db)

@app.post("/api/audit/market-prices", response_model=schemas.MarketPriceResponse)
def add_or_update_market_price(
    price_data: schemas.MarketPriceCreate,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(admin_only)
):
    return crud.create_or_update_market_price(db, price_data)


@app.delete("/api/audit/market-prices/{id}")
def delete_market_price(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(admin_only)
):
    success = crud.delete_market_price(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Referensi harga tidak ditemukan.")
    return {"status": "success", "message": f"Berhasil menghapus harga referensi ID {id}"}


@app.get("/api/audit/market-prices/history", response_model=List[schemas.MarketPriceResponse])
def read_market_price_history(
    item_name: str,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(coordinator_only)
):
    return crud.get_market_price_history(db, item_name)




