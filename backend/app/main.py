from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from . import crud, models, schemas
from .database import engine, get_db
from .dependencies import (
    coordinator_only, 
    admin_only, 
    finance_only, 
    nutrition_only, 
    sppg_staff_only, 
    verify_sppg_access
)
import logging
import os
import pandas as pd
import io
from dotenv import load_dotenv

# Load .env from root
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

def _parse_flex_date(raw: str) -> Optional[date]:
    """Parse 'YYYY-MM-DD' or 'dd/mm/yyyy' or 'dd-mm-yyyy' into a date."""
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None

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
def update_sppg_checklist(sppg_id: int, checklist: schemas.SPPGChecklistUpdate, db: Session = Depends(get_db), current_user: models.Profile = Depends(nutrition_only)):
    verify_sppg_access(current_user, sppg_id)
    return crud.update_sppg_checklist(db, sppg_id, checklist)


# --- SMART AUDIT & POTENTIAL LOSS DETECTION ENDPOINTS ---

@app.post("/api/audit/upload", response_model=schemas.AuditReportDetailResponse)
async def upload_audit_file(
    file: UploadFile = File(...),
    nota_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only)
):
    try:
        contents = await file.read()

        # 0. Resolve the nota date: explicit user input > OCR detected > today
        parsed_nota_date = None
        if nota_date and nota_date.strip():
            parsed_nota_date = _parse_flex_date(nota_date.strip())
        if parsed_nota_date is None:
            parsed_nota_date = datetime.now(timezone.utc).date()
        
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
            
        # 3. OCR scanning (Gemini + Local Fallback) with tanggal detection
        from .ocr import perform_ocr_with_meta
        api_key = crud.get_gemini_api_key(db)
        extracted_items, ocr_tanggal = perform_ocr_with_meta(
            contents, file.filename, file.content_type, api_key=api_key
        )
        
        if not extracted_items:
            raise HTTPException(status_code=400, detail="Gagal mengekstrak item dari dokumen. Silakan periksa format dokumen.")

        # Use OCR-detected date only when the user did not explicitly pass one
        if not (nota_date and nota_date.strip()) and ocr_tanggal:
            parsed_nota_date = ocr_tanggal
            
        # 4. Save to database & record in audit trail logs
        db_report = crud.create_audit_report(
            db, doc_url, extracted_items, current_user.id, current_user.sppg_id,
            nota_date=parsed_nota_date,
        )
        return db_report
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gagal memproses file audit: {str(e)}")

@app.get("/api/audit/reports", response_model=List[schemas.AuditReportResponse])
def read_audit_reports(db: Session = Depends(get_db), current_user: models.Profile = Depends(finance_only)):
    return crud.get_audit_reports(db, user=current_user)

@app.get("/api/audit/reports/{id}", response_model=schemas.AuditReportDetailResponse)
def read_audit_report_detail(id: int, db: Session = Depends(get_db), current_user: models.Profile = Depends(finance_only)):
    report = crud.get_audit_report(db, id, user=current_user)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    return report

@app.delete("/api/audit/reports/{id}")
def delete_audit_report(id: int, db: Session = Depends(get_db), current_user: models.Profile = Depends(admin_only)):
    success = crud.delete_audit_report(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    return {"status": "success", "message": f"Berhasil menghapus laporan audit ID {id}"}

# --- Official LHA-style report generation & approval ---

def _fetch_ttd_image_bytes(url: str) -> bytes:
    """Download the ttd signature image if configured."""
    if not url:
        return b""
    try:
        import urllib.request
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
        return data if len(data) > 100 else b""
    except Exception as e:
        print(f"TTD image fetch warning: {e}")
        return b""


@app.post("/api/audit/reports/{id}/generate", response_model=schemas.AuditReportDetailResponse)
def generate_audit_report_pdf(id: int, db: Session = Depends(get_db), current_user: models.Profile = Depends(finance_only)):
    report = crud.get_audit_report(db, id, user=current_user)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    if not report.items:
        raise HTTPException(status_code=400, detail="Laporan tidak memiliki item untuk dibangun. Silakan unggah ulang dokumen.")
    try:
        from .reporting import build_audit_report_pdf
        config = crud.get_report_config(db)
        sppg_name = report.sppg.nama if report.sppg else (getattr(report, "sppg_name", None) or None)
        ttd_bytes = _fetch_ttd_image_bytes(config.get("laporan_ttd_url") or "")
        pdf_bytes = build_audit_report_pdf(
            report,
            report.items,
            sppg_name,
            config,
            penyusun=(current_user.full_name or current_user.email.split("@")[0]) if current_user else None,
            ttd_image_bytes=ttd_bytes,
        )
        if not pdf_bytes:
            raise HTTPException(status_code=500, detail="Gagal menghasilkan PDF laporan.")

        # Persist generated PDF (Supabase Storage -> local fallback)
        report_url = None
        bucket_name = "audit_reports"
        if crud.supabase:
            try:
                try:
                    crud.supabase.storage.create_bucket(bucket_name, options={"public": True})
                except Exception:
                    pass
                import uuid
                unique_filename = f"{uuid.uuid4()}.pdf"
                crud.supabase.storage.from_(bucket_name).upload(
                    path=unique_filename,
                    file=pdf_bytes,
                    file_options={"content-type": "application/pdf"},
                )
                report_url = crud.supabase.storage.from_(bucket_name).get_public_url(unique_filename)
            except Exception as e:
                print(f"Supabase Storage report upload warning: {e}")
        if not report_url:
            import uuid
            unique_filename = f"{uuid.uuid4()}.pdf"
            local_path = os.path.join(UPLOAD_DIR, unique_filename)
            with open(local_path, "wb") as f_out:
                f_out.write(pdf_bytes)
            report_url = f"/static/uploads/{unique_filename}"

        # Number only assigned once (stable across regeneration)
        number = report.report_number or crud.generate_report_number(db, report.sppg, config.get("laporan_nomor_prefix") or "LHA")
        cur_date = date.today()

        report = crud.save_audit_report_metadata(
            db, report.id,
            report_number=number,
            report_url=report_url,
            report_status="draft",
            report_date=cur_date,
        )

        # Record in audit trail
        try:
            db.execute(
                text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"),
                {
                    "action": "AUDIT_REPORT_GENERATE",
                    "table": "audit_reports",
                    "id": report.id,
                    "details": f"Generated official LHA report {report.report_number}",
                },
            )
            db.commit()
        except Exception:
            db.rollback()

        return report
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gagal membuat laporan resmi: {str(e)}")


@app.post("/api/audit/reports/{id}/approve", response_model=schemas.AuditReportDetailResponse)
def approve_audit_report_pdf(
    id: int,
    body: Optional[schemas.AuditReportApproveRequest] = None,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(admin_only),
):
    report = crud.get_audit_report(db, id, user=current_user)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    if report.report_status not in ("draft", None):
        raise HTTPException(status_code=400, detail="Hanya laporan berstatus DRAFT yang dapat difinalkan.")

    if body and body.summary:
        report = crud.save_audit_report_metadata(db, id, summary=body.summary)
    report = crud.approve_audit_report(db, id, current_user)
    if report == "invalid-state":
        raise HTTPException(status_code=400, detail="Status laporan tidak valid untuk persetujuan.")
    if not report:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")

    try:
        db.execute(
            text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"),
            {
                "action": "AUDIT_REPORT_APPROVE",
                "table": "audit_reports",
                "id": report.id,
                "details": f"Official LHA report approved by {current_user.full_name or current_user.id}",
            },
        )
        db.commit()
    except Exception:
        db.rollback()

    return report


@app.post("/api/audit/reports/{id}/rematch", response_model=schemas.AuditReportDetailResponse)
def rematch_audit_report_pdf(
    id: int,
    body: Optional[schemas.AuditReportRematchRequest] = None,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only),
):
    """Re-run unit+date-aware price matching on an existing report (corrects
    the nota date and/or applies updated unit conversions)."""
    report = crud.get_audit_report(db, id, user=current_user)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    if report.report_status in ("final", "void"):
        raise HTTPException(
            status_code=400,
            detail="Pencocokan ulang tidak dapat dilakukan pada laporan yang sudah difinalkan / dibatalkan.",
        )
    report = crud.rematch_audit_report(db, id, nota_date=body.nota_date if body else None)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    return report


@app.get("/api/audit/reports/{id}/pdf")
def download_audit_report_pdf(id: int, db: Session = Depends(get_db), current_user: models.Profile = Depends(finance_only)):
    report = crud.get_audit_report(db, id, user=current_user)
    if not report:
        raise HTTPException(status_code=404, detail="Laporan audit tidak ditemukan.")
    if not report.report_url:
        raise HTTPException(status_code=400, detail="Laporan resmi belum dibuat. Klik 'Buat Laporan Resmi (PDF)' terlebih dahulu.")
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=report.report_url)

@app.get("/api/audit/market-prices", response_model=List[schemas.MarketPriceResponse])
def read_market_prices(db: Session = Depends(get_db), current_user: models.Profile = Depends(finance_only)):
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


# System Settings API (admin-only, e.g. Gemini API key for Smart Audit OCR)
@app.get("/api/system-settings", response_model=List[schemas.SystemSettingResponse])
def read_system_settings(db: Session = Depends(get_db), _ = Depends(admin_only)):
    settings = crud.get_all_system_settings(db)
    return [
        schemas.SystemSettingResponse(
            key=s.key,
            is_secret=s.is_secret or False,
            is_configured=bool(s.value and s.value.strip()),
            updated_at=s.updated_at
        )
        for s in settings
    ]


@app.put("/api/system-settings/{key}", response_model=schemas.SystemSettingResponse)
def update_system_setting(
    key: str,
    payload: schemas.SystemSettingUpsert,
    db: Session = Depends(get_db),
    _ = Depends(admin_only)
):
    setting = crud.upsert_system_setting(db, key, payload.value, payload.is_secret or False)
    return schemas.SystemSettingResponse(
        key=setting.key,
        is_secret=setting.is_secret or False,
        is_configured=bool(setting.value and setting.value.strip()),
        updated_at=setting.updated_at
    )


@app.post("/api/system-settings/ttd-upload")
async def upload_ttd_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _ = Depends(admin_only),
):
    """Upload tanda tangan (ttd) untuk kop pengesahan laporan resmi."""
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="File kosong.")
    ext = (file.filename or "").split(".")[-1].lower()
    if ext not in ("png", "jpg", "jpeg"):
        raise HTTPException(status_code=400, detail="Gambar tanda tangan harus berformat PNG/JPG.")

    url = None
    if crud.supabase:
        try:
            try:
                crud.supabase.storage.create_bucket("report_assets", options={"public": True})
            except Exception:
                pass
            from uuid import uuid4
            fn = f"{uuid4()}.{ext}"
            crud.supabase.storage.from_("report_assets").upload(
                path=fn,
                file=contents,
                file_options={"content-type": file.content_type or "image/png"},
            )
            url = crud.supabase.storage.from_("report_assets").get_public_url(fn)
        except Exception as e:
            print(f"Supabase ttd upload warning: {e}")
    if not url:
        from uuid import uuid4
        fn = f"{uuid4()}.{ext}"
        local_path = os.path.join(UPLOAD_DIR, fn)
        with open(local_path, "wb") as f_out:
            f_out.write(contents)
        url = f"/static/uploads/{fn}"

    crud.upsert_system_setting(db, "laporan_ttd_url", url, is_secret=False)
    return {"url": url}


@app.get("/api/system-settings/unit-conversions")
def read_unit_conversions(db: Session = Depends(get_db), _ = Depends(admin_only)):
    """Return the unit conversion table (base + factor) used by smart matching."""
    return crud.get_unit_conversions(db)


@app.put("/api/system-settings/unit-conversions")
def update_unit_conversions(
    body: schemas.UnitConversionsIn,
    db: Session = Depends(get_db),
    _ = Depends(admin_only),
):
    """Validate and persist admin-editable unit conversions."""
    return crud.save_unit_conversions(db, body.conversions)


# Dashboard Stats
@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@app.get("/api/audit/market-prices/history", response_model=List[schemas.MarketPriceResponse])
def read_market_price_history(
    item_name: str,
    date_from: date = None,
    date_to: date = None,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only)
):
    return crud.get_market_price_history(db, item_name, date_from=date_from, date_to=date_to)


# --- COMMODITY PRICE TRACKING ENDPOINTS ---

@app.get("/api/commodities/items", response_model=List[schemas.CommodityItemResponse])
def read_commodity_items(
    skip: int = 0,
    limit: int = 100,
    kategori: str = None,
    db: Session = Depends(get_db)
):
    return crud.get_commodity_items(db, skip=skip, limit=limit, kategori=kategori)


@app.post("/api/commodities/items", response_model=schemas.CommodityItemResponse)
def create_commodity_item(
    data: schemas.CommodityItemCreate,
    db: Session = Depends(get_db),
    _ = Depends(finance_only)
):
    try:
        return crud.create_commodity_item(db, data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal menambah komoditas: {str(e)}")


@app.put("/api/commodities/items/{item_id}", response_model=schemas.CommodityItemResponse)
def update_commodity_item(
    item_id: int,
    data: schemas.CommodityItemCreate,
    db: Session = Depends(get_db),
    _ = Depends(finance_only)
):
    try:
        db_item = crud.update_commodity_item(db, item_id, data)
        if not db_item:
            raise HTTPException(status_code=404, detail="Komoditas tidak ditemukan.")
        return db_item
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memperbarui komoditas: {str(e)}")


@app.delete("/api/commodities/items/{item_id}")
def delete_commodity_item(
    item_id: int,
    db: Session = Depends(get_db),
    _ = Depends(admin_only)
):
    success = crud.delete_commodity_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Komoditas tidak ditemukan.")
    return {"status": "success", "message": "Komoditas berhasil dihapus."}


@app.post("/api/commodities/survey")
def submit_market_survey(
    survey: schemas.MarketSurveyCreate,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only)
):
    return crud.submit_market_survey(db, survey, current_user)


@app.post("/api/commodities/survey/import-excel")
def import_market_survey_excel(
    payload: schemas.MarketSurveyExcelImportRequest,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only)
):
    try:
        if not payload.surveyor_name and current_user:
            payload.surveyor_name = current_user.full_name
        return crud.import_market_survey_excel(db, payload, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal mengimpor data survei dari Excel: {str(e)}")


@app.post("/api/commodities/survey/upload-documentation")
async def upload_survey_documentation(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only)
):
    """
    Upload and compress survey activity documentation photos.
    Compresses image files (max 1600px, WebP/JPEG, quality 80) and saves to Supabase Storage or local fallback.
    """
    from .media_utils import compress_and_save_image
    uploaded_urls = []
    bucket_name = "survey_documentation"

    for file in files:
        try:
            contents = await file.read()
            unique_filename, compressed_bytes, mime = compress_and_save_image(
                contents, file.filename, file.content_type, max_dimension=1600, quality=80, output_format="WEBP"
            )
            
            file_url = None
            if crud.supabase:
                try:
                    try:
                        crud.supabase.storage.create_bucket(bucket_name, options={"public": True})
                    except Exception:
                        pass
                    crud.supabase.storage.from_(bucket_name).upload(
                        path=unique_filename,
                        file=compressed_bytes,
                        file_options={"content-type": mime}
                    )
                    file_url = crud.supabase.storage.from_(bucket_name).get_public_url(unique_filename)
                except Exception as e:
                    logging.getLogger("sppg_survey").warning(f"Supabase upload warning: {e}")

            if not file_url:
                local_path = os.path.join(UPLOAD_DIR, unique_filename)
                with open(local_path, "wb") as f_out:
                    f_out.write(compressed_bytes)
                file_url = f"/static/uploads/{unique_filename}"

            uploaded_urls.append({
                "original_filename": file.filename,
                "url": file_url,
                "original_size": len(contents),
                "compressed_size": len(compressed_bytes),
                "saved_percentage": round((1 - (len(compressed_bytes) / max(len(contents), 1))) * 100, 1)
            })
        except Exception as e:
            logging.getLogger("sppg_survey").error(f"Failed to upload photo {file.filename}: {e}")

    return {"uploaded_photos": uploaded_urls}


@app.post("/api/commodities/survey/scan-official-doc")
async def scan_official_survey_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only)
):
    """
    Upload, compress, and perform OCR extraction on an official survey document signed by Head of Market.
    """
    from .media_utils import compress_and_save_image
    from .ocr import perform_survey_doc_ocr

    try:
        contents = await file.read()
        unique_filename, compressed_bytes, mime = compress_and_save_image(
            contents, file.filename, file.content_type, max_dimension=1800, quality=82, output_format="WEBP"
        )
        
        doc_url = None
        bucket_name = "survey_official_documents"

        if crud.supabase:
            try:
                try:
                    crud.supabase.storage.create_bucket(bucket_name, options={"public": True})
                except Exception:
                    pass
                crud.supabase.storage.from_(bucket_name).upload(
                    path=unique_filename,
                    file=compressed_bytes,
                    file_options={"content-type": mime}
                )
                doc_url = crud.supabase.storage.from_(bucket_name).get_public_url(unique_filename)
            except Exception as e:
                logging.getLogger("sppg_survey").warning(f"Supabase upload warning: {e}")

        if not doc_url:
            local_path = os.path.join(UPLOAD_DIR, unique_filename)
            with open(local_path, "wb") as f_out:
                f_out.write(compressed_bytes)
            doc_url = f"/static/uploads/{unique_filename}"

        # Run OCR extraction
        api_key = crud.get_gemini_api_key(db)
        ocr_result = perform_survey_doc_ocr(compressed_bytes, file.filename, mime, api_key=api_key)

        return {
            "doc_url": doc_url,
            "filename": file.filename,
            "original_size": len(contents),
            "compressed_size": len(compressed_bytes),
            "saved_percentage": round((1 - (len(compressed_bytes) / max(len(contents), 1))) * 100, 1),
            "extracted_data": ocr_result
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gagal memproses dan memindai dokumen survey: {str(e)}")


@app.get("/api/commodities/prices", response_model=List[schemas.MarketPriceResponse])
def read_commodity_prices(
    item_name: str = None,
    date_from: date = None,
    date_to: date = None,
    region: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud.get_commodity_prices(
        db, item_name=item_name, date_from=date_from, date_to=date_to,
        region=region, skip=skip, limit=limit
    )


@app.get("/api/commodities/surveys", response_model=List[schemas.SurveySessionSummary])
def read_survey_sessions(
    db: Session = Depends(get_db)
):
    return crud.get_survey_sessions(db)


@app.get("/api/commodities/surveys/{session_id}", response_model=List[schemas.MarketPriceResponse])
def read_survey_session_items(
    session_id: str,
    db: Session = Depends(get_db)
):
    items = crud.get_survey_session_items(db, session_id)
    if not items:
        raise HTTPException(status_code=404, detail="Sesi survey tidak ditemukan.")
    return items


@app.delete("/api/commodities/surveys/{session_id}")
def delete_survey_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(admin_only)
):
    success = crud.delete_survey_session(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sesi survey tidak ditemukan.")
    return {"status": "success", "message": f"Sesi survey {session_id} berhasil dihapus."}


@app.put("/api/commodities/prices/{price_id}", response_model=schemas.MarketPriceResponse)
def update_price_entry(
    price_id: int,
    data: schemas.MarketPriceUpdate,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only)
):
    db_item = crud.update_market_price_entry(db, price_id, data)
    if not db_item:
        raise HTTPException(status_code=404, detail="Data harga tidak ditemukan.")
    return db_item


@app.delete("/api/commodities/prices/{price_id}")
def delete_price_entry(
    price_id: int,
    db: Session = Depends(get_db),
    current_user: models.Profile = Depends(finance_only)
):
    success = crud.delete_market_price_entry(db, price_id)
    if not success:
        raise HTTPException(status_code=404, detail="Data harga tidak ditemukan.")
    return {"status": "success", "message": f"Data harga ID {price_id} berhasil dihapus."}


@app.get("/api/commodities/prices/latest", response_model=List[schemas.LatestPriceResponse])
def read_latest_prices(
    db: Session = Depends(get_db)
):
    return crud.get_latest_prices(db)


@app.get("/api/commodities/prices/stats", response_model=schemas.MarketPriceStats)
def read_price_stats(
    item_name: str = Query(..., description="Nama item (case insensitive)"),
    period_start: date = None,
    period_end: date = None,
    db: Session = Depends(get_db)
):
    stats = crud.get_price_stats(db, item_name, period_start=period_start, period_end=period_end)
    if not stats:
        raise HTTPException(status_code=404, detail="Data harga tidak ditemukan untuk item tersebut.")
    return stats


@app.get("/api/commodities/disperindag-ntb-live", response_model=List[schemas.DisperindagLivePriceResponse])
def read_disperindag_ntb_live_prices(
    db: Session = Depends(get_db)
):
    return crud.get_disperindag_ntb_live_prices(db)





