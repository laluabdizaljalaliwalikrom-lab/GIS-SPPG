from sqlalchemy.orm import Session
from sqlalchemy import func, asc, text, and_
from . import models, schemas
import os
import logging
from datetime import date
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

# Initialize Supabase Admin client
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

def parse_point(pt: str):
    if not pt: return 0.0, 0.0
    pt = pt.replace("POINT(", "").replace(")", "")
    parts = pt.split(" ")
    return float(parts[0]), float(parts[1])

def get_user_profile(db: Session, user_id: str):
    profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if profile and profile.sppg_id:
        sppg = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == profile.sppg_id).first()
        profile.sppg_name = sppg.nama if sppg else None
    return profile

def get_sppgs(db: Session, skip: int = 0, limit: int = 100, name: str = None):
    query = db.query(models.SPPGUnit)
    if name:
        query = query.filter(models.SPPGUnit.nama.ilike(f"%{name}%"))
    sppgs = query.offset(skip).limit(limit).all()
    
    # Calculate current allocations for all SPPGs in one go
    allocations = db.query(
        models.KelompokPenerima.assigned_sppg_id,
        func.sum(
            func.coalesce(models.KelompokDetail.porsi_kecil, 0) +
            func.coalesce(models.KelompokDetail.porsi_besar, 0) +
            func.coalesce(models.KelompokDetail.jumlah_busui, 0) +
            func.coalesce(models.KelompokDetail.jumlah_bumil, 0) +
            func.coalesce(models.KelompokDetail.jumlah_balita_non_paud, 0)
        ).label('total_allocated')
    ).join(models.KelompokDetail, models.KelompokPenerima.id == models.KelompokDetail.kelompok_id)\
     .filter(models.KelompokPenerima.assigned_sppg_id != None)\
     .group_by(models.KelompokPenerima.assigned_sppg_id).all()
    
    alloc_map = {a.assigned_sppg_id: a.total_allocated for a in allocations}

    result = []
    for s in sppgs:
        pt = db.scalar(func.ST_AsText(s.geom))
        lng, lat = parse_point(pt)
        s_dict = {k: v for k, v in s.__dict__.items() if not k.startswith('_')}
        s_dict['lat'] = lat
        s_dict['lng'] = lng
        
        allocated = alloc_map.get(s.id, 0)
        s_dict['remaining_capacity'] = max(0, s.kapasitas_produksi - allocated)
        
        result.append(schemas.SPPGUnitResponse(**s_dict))
    return result

def create_sppg(db: Session, sppg: schemas.SPPGUnitCreate):
    geom = f"POINT({sppg.lng} {sppg.lat})"
    s_data = sppg.model_dump(exclude={'lat', 'lng'})
    db_sppg = models.SPPGUnit(**s_data, geom=func.ST_GeogFromText(geom))
    db.add(db_sppg)
    db.commit()
    db.refresh(db_sppg)
    db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
               {"action": "CREATE_SPPG", "table": "sppg_units", "id": db_sppg.id, "details": f"Created SPPG {db_sppg.nama}"})
    db.commit()
    return db_sppg

def get_kelompoks(db: Session, skip: int = 0, limit: int = 100, name: str = None, status: str = None, type: str = None):
    query = db.query(models.KelompokPenerima)
    if name:
        query = query.filter(models.KelompokPenerima.nama.ilike(f"%{name}%"))
    if status:
        query = query.filter(models.KelompokPenerima.status == status)
    if type:
        query = query.filter(models.KelompokPenerima.jenis_kelompok == type)
        
    kelompoks = query.offset(skip).limit(limit).all()
    result = []
    for k in kelompoks:
        pt = db.scalar(func.ST_AsText(k.geom))
        lng, lat = parse_point(pt)
        k_dict = {k_key: v for k_key, v in k.__dict__.items() if not k_key.startswith('_')}
        k_dict['lat'] = lat
        k_dict['lng'] = lng
        k_dict['status'] = k.status
        k_dict['detail'] = k.detail
        result.append(schemas.KelompokPenerimaResponse(**k_dict))
    return result

def create_kelompok(db: Session, kelompok: schemas.KelompokPenerimaCreate, current_user: models.Profile):
    geom = f"POINT({kelompok.lng} {kelompok.lat})"
    k_data = kelompok.model_dump(exclude={'lat', 'lng', 'detail', 'status'})
    
    # Logic: Admin creations are auto-verified
    status = 'verified' if current_user.role == 'admin' else 'pending_verification'
    
    db_kelompok = models.KelompokPenerima(**k_data, geom=func.ST_GeogFromText(geom), status=status)
    db.add(db_kelompok)
    db.commit()
    db.refresh(db_kelompok)
    
    # Detail
    d_data = kelompok.detail.model_dump()
    db_detail = models.KelompokDetail(**d_data, kelompok_id=db_kelompok.id)
    db.add(db_detail)
    db.commit()
    
    # Audit log (using direct SQL since we don't have a model yet)
    db.execute(func.log_action(None, 'CREATE', 'kelompok_penerima', db_kelompok.id, f"Created {db_kelompok.nama}"))
    db.commit()
    
    return db_kelompok

def update_sppg(db: Session, sppg_id: int, sppg: schemas.SPPGUnitCreate):
    db_sppg = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == sppg_id).first()
    if db_sppg:
        update_data = sppg.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_sppg, key, value)
        # Update point
        db_sppg.geom = f'POINT({sppg.lng} {sppg.lat})'
        db.commit()
        db.refresh(db_sppg)
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {"action": "UPDATE_SPPG", "table": "sppg_units", "id": db_sppg.id, "details": f"Updated SPPG {db_sppg.nama}"})
        db.commit()
    return db_sppg

def delete_sppg(db: Session, sppg_id: int):
    db_sppg = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == sppg_id).first()
    if db_sppg:
        db.delete(db_sppg)
        db.commit()
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {"action": "DELETE_SPPG", "table": "sppg_units", "id": sppg_id, "details": f"Deleted SPPG unit ID {sppg_id}"})
        db.commit()
    return db_sppg

def update_kelompok(db: Session, kelompok_id: int, kelompok: schemas.KelompokPenerimaCreate):
    db_k = db.query(models.KelompokPenerima).filter(models.KelompokPenerima.id == kelompok_id).first()
    if db_k:
        update_data = kelompok.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key != 'detail':
                setattr(db_k, key, value)
        if kelompok.detail:
            if db_k.detail:
                detail_data = kelompok.detail.model_dump(exclude_unset=True)
                for d_key, d_value in detail_data.items():
                    setattr(db_k.detail, d_key, d_value)
            else:
                db_k.detail = models.KelompokDetail(**kelompok.detail.model_dump())
        # Update point
        db_k.geom = f'POINT({kelompok.lng} {kelompok.lat})'
        db.commit()
        db.refresh(db_k)
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {"action": "UPDATE_KELOMPOK", "table": "kelompok_penerima", "id": db_k.id, "details": f"Updated Kelompok {db_k.nama}"})
        db.commit()
    return db_k

def delete_kelompok(db: Session, kelompok_id: int):
    db_k = db.query(models.KelompokPenerima).filter(models.KelompokPenerima.id == kelompok_id).first()
    if db_k:
        db.delete(db_k)
        db.commit()
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {"action": "DELETE_KELOMPOK", "table": "kelompok_penerima", "id": kelompok_id, "details": f"Deleted Kelompok ID {kelompok_id}"})
        db.commit()
    return db_k

def verify_kelompok(db: Session, kelompok_id: int, status: str):
    db_k = db.query(models.KelompokPenerima).filter(models.KelompokPenerima.id == kelompok_id).first()
    if db_k:
        db_k.status = status
        db.commit()
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {"action": "VERIFY_KELOMPOK", "table": "kelompok_penerima", "id": kelompok_id, "details": f"Changed status of {db_k.nama} to {status}"})
        db.commit()
    return db_k

def assign_manual(db: Session, req: schemas.ManualAssignRequest):
    k = db.query(models.KelompokPenerima).filter(models.KelompokPenerima.id == req.group_id).first()
    
    if not k:
        return None

    if not req.sppg_id or req.sppg_id == 0:
        old_sppg_id = k.assigned_sppg_id
        k.assigned_sppg_id = None
        db.commit()
        db.refresh(k)
        
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {
                       "action": "UNASSIGN", 
                       "table": "kelompok_penerima", 
                       "id": k.id, 
                       "details": f"Unassigned {k.nama} (previously from SPPG ID {old_sppg_id})"
                   })
        db.commit()
        return k

    sppg = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == req.sppg_id).first()
    if sppg:
        k.assigned_sppg_id = req.sppg_id
        db.commit()
        db.refresh(k)
        
        # Record in audit_logs
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {
                       "action": "MANUAL_ASSIGN", 
                       "table": "kelompok_penerima", 
                       "id": k.id, 
                       "details": f"Manually assigned {k.nama} to {sppg.nama}"
                   })
        db.commit()
    return k

def allocate_automatic(db: Session):
    # Get all unassigned groups
    unassigned = db.query(models.KelompokPenerima).filter(models.KelompokPenerima.assigned_sppg_id == None).all()
    sppgs = db.query(models.SPPGUnit).all()
    
    # Calculate current capacity used per SPPG
    sppg_usage = {s.id: 0 for s in sppgs}
    # To properly calculate usage, we'd sum up the "porsi" from detail.
    # For simplicity, let's assume each detail record contributes to a total "demand"
    assigned = db.query(models.KelompokPenerima).filter(models.KelompokPenerima.assigned_sppg_id != None).all()
    for a in assigned:
        if a.detail:
            demand = (a.detail.porsi_kecil or 0) + (a.detail.porsi_besar or 0)
            # Add posyandu demand if applicable
            demand += (a.detail.jumlah_busui or 0) + (a.detail.jumlah_bumil or 0) + (a.detail.jumlah_balita_non_paud or 0)
            # Default to 1 if 0 to ensure some capacity is used
            if demand == 0: demand = 10 
            if a.assigned_sppg_id in sppg_usage:
                sppg_usage[a.assigned_sppg_id] += demand

    assigned_count = 0
    for group in unassigned:
        group_demand = 0
        if group.detail:
            group_demand = (group.detail.porsi_kecil or 0) + (group.detail.porsi_besar or 0)
            group_demand += (group.detail.jumlah_busui or 0) + (group.detail.jumlah_bumil or 0) + (group.detail.jumlah_balita_non_paud or 0)
            if group_demand == 0: group_demand = 10

        # Find nearest SPPG with capacity
        # Order SPPGs by distance to this group
        nearest_sppgs = db.query(models.SPPGUnit).order_by(
            func.ST_Distance(models.SPPGUnit.geom, group.geom)
        ).all()

        for sppg in nearest_sppgs:
            if sppg_usage[sppg.id] + group_demand <= sppg.kapasitas_produksi:
                group.assigned_sppg_id = sppg.id
                sppg_usage[sppg.id] += group_demand
                assigned_count += 1
                db.commit()
                break

    return {"status": "success", "assigned_count": assigned_count}

def get_users(db: Session):
    profiles = db.query(models.Profile).all()
    for p in profiles:
        if p.sppg_id and not hasattr(p, 'sppg_name'):
            sppg = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == p.sppg_id).first()
            p.sppg_name = sppg.nama if sppg else None
        else:
            p.sppg_name = None
    return profiles

def update_user(db: Session, user_id: str, profile: schemas.ProfileBase):
    db_profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if db_profile:
        update_data = profile.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_profile, key, value)
        db.commit()
        db.refresh(db_profile)
        if db_profile.sppg_id:
            sppg = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == db_profile.sppg_id).first()
            db_profile.sppg_name = sppg.nama if sppg else None
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {"action": "UPDATE_USER", "table": "profiles", "id": None, "details": f"Updated profile for {db_profile.full_name} ({user_id})"})
        db.commit()
    return db_profile

def delete_user(db: Session, user_id: str):
    if not supabase:
        raise Exception("Supabase Admin client not initialized")
        
    db_profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if db_profile:
        # Delete from Supabase Auth
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as e:
            print(f"Warning: Could not delete user from auth: {e}")
            
        # Delete from public.profiles
        db.delete(db_profile)
        db.commit()
        db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                   {"action": "DELETE_USER", "table": "profiles", "id": None, "details": f"Deleted profile ID {user_id}"})
        db.commit()
    return db_profile

def create_user(db: Session, user_data: schemas.UserCreate):
    if not supabase:
        raise Exception("Supabase Admin client not initialized. Please add SUPABASE_SERVICE_ROLE_KEY to .env")
    
    # Create user in auth.users
    auth_res = supabase.auth.admin.create_user({
        "email": user_data.email,
        "password": user_data.password,
        "email_confirm": True,
        "user_metadata": {"full_name": user_data.full_name}
    })
    
    if not auth_res.user:
        raise Exception("Failed to create user in Supabase Auth")
    
    # The profile should be created automatically by a trigger in DB,
    # but we update it to set the role and name correctly.
    user_id = auth_res.user.id
    db_profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    
    if not db_profile:
        # If trigger didn't run for some reason
        db_profile = models.Profile(
            id=user_id, 
            full_name=user_data.full_name, 
            role=user_data.role,
            sppg_id=user_data.sppg_id
        )
        db.add(db_profile)
    else:
        db_profile.full_name = user_data.full_name
        db_profile.role = user_data.role
        db_profile.sppg_id = user_data.sppg_id
    
    db.commit()
    db.refresh(db_profile)

    if db_profile.sppg_id:
        sppg = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == db_profile.sppg_id).first()
        db_profile.sppg_name = sppg.nama if sppg else None
    
    db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
               {"action": "CREATE_USER", "table": "profiles", "id": None, "details": f"Created new user {user_data.full_name} with role {user_data.role} ({user_id})"})
    db.commit()
    
    return db_profile
def import_sppgs(db: Session, data: list[dict]):
    results = {"success": 0, "failed": 0, "errors": []}
    for i, row in enumerate(data):
        try:
            geom = f"POINT({row['longitude']} {row['latitude']})"
            db_sppg = models.SPPGUnit(
                nama=row.get('nama'),
                kode_sppg=row.get('kode_sppg', f"SPPG-{i+100}"),
                alamat_desa=row.get('alamat_desa') or row.get('alamat', ''),
                status_operasional=row.get('status_operasional', 'Aktif'),
                tanggal_operasional=row.get('tanggal_operasional', date.today()),
                nama_kepala=row.get('nama_kepala', '-'),
                pengawas_keuangan=row.get('pengawas_keuangan'),
                pengawas_gizi=row.get('pengawas_gizi'),
                pic_yayasan=row.get('pic_yayasan'),
                nama_yayasan=row.get('nama_yayasan'),
                kapasitas_produksi=row.get('kapasitas_produksi', 0),
                geom=func.ST_GeogFromText(geom)
            )
            db.add(db_sppg)
            db.commit()
            db.refresh(db_sppg)
            
            db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                       {"action": "IMPORT_SPPG", "table": "sppg_units", "id": db_sppg.id, "details": f"Imported SPPG {db_sppg.nama}"})
            db.commit()
            results["success"] += 1
        except Exception as e:
            db.rollback()
            results["failed"] += 1
            results["errors"].append(f"Baris {i+1}: {str(e)}")
    return results

def import_kelompoks(db: Session, data: list[dict], current_user: models.Profile):
    results = {"success": 0, "failed": 0, "errors": []}
    status = 'verified' if current_user.role == 'admin' else 'pending_verification'
    
    for i, row in enumerate(data):
        try:
            geom = f"POINT({row['longitude']} {row['latitude']})"
            db_kelompok = models.KelompokPenerima(
                nama=row['nama'],
                alamat=row.get('alamat', ''),
                jenis_kelompok=row.get('jenis_kelompok', 'Sekolah'),
                status=status,
                geom=func.ST_GeogFromText(geom)
            )
            db.add(db_kelompok)
            db.commit()
            db.refresh(db_kelompok)
            
            # Create Detail
            db_detail = models.KelompokDetail(
                kelompok_id=db_kelompok.id,
                porsi_kecil=row.get('porsi_kecil', 0),
                porsi_besar=row.get('porsi_besar', 0),
                jumlah_busui=row.get('jumlah_busui', 0),
                jumlah_bumil=row.get('jumlah_bumil', 0),
                jumlah_balita_non_paud=row.get('jumlah_balita_non_paud', 0)
            )
            db.add(db_detail)
            db.commit()
            
            db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
                       {"action": "IMPORT_KELOMPOK", "table": "kelompok_penerima", "id": db_kelompok.id, "details": f"Imported Kelompok {db_kelompok.nama}"})
            db.commit()
            results["success"] += 1
        except Exception as e:
            db.rollback()
            results["failed"] += 1
            results["errors"].append(f"Baris {i+1}: {str(e)}")
    return results

# Raport Points CRUD
def get_raport_points(db: Session):
    return db.query(models.RaportPoint).all()

def create_raport_point(db: Session, point: schemas.RaportPointCreate):
    db_point = models.RaportPoint(**point.model_dump())
    db.add(db_point)
    db.commit()
    db.refresh(db_point)
    return db_point

def delete_raport_point(db: Session, point_id: int):
    db_point = db.query(models.RaportPoint).filter(models.RaportPoint.id == point_id).first()
    if db_point:
        db.delete(db_point)
        db.commit()
    return db_point

# SPPG Checklist Answers
def get_sppg_answers(db: Session, sppg_id: int):
    return db.query(models.SPPGPointAnswer).filter(models.SPPGPointAnswer.sppg_id == sppg_id).all()

def update_sppg_checklist(db: Session, sppg_id: int, checklist: schemas.SPPGChecklistUpdate):
    # Remove old answers for the points provided (or all points for this SPPG)
    # Actually, let's just update or create.
    for ans in checklist.answers:
        db_ans = db.query(models.SPPGPointAnswer).filter(
            models.SPPGPointAnswer.sppg_id == sppg_id,
            models.SPPGPointAnswer.point_id == ans.point_id
        ).first()
        
        if db_ans:
            db_ans.is_fulfilled = ans.is_fulfilled
        else:
            db_ans = models.SPPGPointAnswer(
                sppg_id=sppg_id,
                point_id=ans.point_id,
                is_fulfilled=ans.is_fulfilled
            )
            db.add(db_ans)
    
    db.commit()
    
    # Recalculate scores for this SPPG
    recalculate_sppg_scores(db, sppg_id)
    
    return get_sppg_answers(db, sppg_id)

def recalculate_sppg_scores(db: Session, sppg_id: int):
    sppg = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == sppg_id).first()
    if not sppg:
        return
    
    points = db.query(models.RaportPoint).all()
    answers = db.query(models.SPPGPointAnswer).filter(models.SPPGPointAnswer.sppg_id == sppg_id).all()
    ans_map = {a.point_id: a.is_fulfilled for a in answers}
    
    categories = [
        'infrastruktur', 'peralatan', 'k3_lingkungan', 'paket_mbg', 'distribusi',
        'dokumentasi', 'penerima_manfaat', 'tenaga_kerja', 'sertifikat_iso', 'administrasi'
    ]
    scores = {}
    
    for cat in categories:
        cat_points = [p for p in points if p.category == cat]
        if not cat_points:
            scores[f"{cat}_score"] = 0
            continue
        
        fulfilled_count = sum(1 for p in cat_points if ans_map.get(p.id, False))
        scores[f"{cat}_score"] = int((fulfilled_count / len(cat_points)) * 100)
    
    sppg.infrastruktur_score = scores['infrastruktur_score']
    sppg.peralatan_score = scores['peralatan_score']
    sppg.k3_lingkungan_score = scores['k3_lingkungan_score']
    sppg.paket_mbg_score = scores['paket_mbg_score']
    sppg.distribusi_score = scores['distribusi_score']
    sppg.dokumentasi_score = scores['dokumentasi_score']
    sppg.penerima_manfaat_score = scores['penerima_manfaat_score']
    sppg.tenaga_kerja_score = scores['tenaga_kerja_score']
    sppg.sertifikat_iso_score = scores['sertifikat_iso_score']
    sppg.administrasi_score = scores['administrasi_score']
    # Keep legacy columns mapped just in case of any fallback (optional, let's map them to relevant averages or keep them 0)
    sppg.sdm_score = scores['tenaga_kerja_score']  # map legacy sdm_score to tenaga_kerja_score
    sppg.kepuasan_score = scores['paket_mbg_score']  # map legacy kepuasan_score to paket_mbg_score
    
    db.commit()


# --- COMMODITY PRICE TRACKING CRUD ---

def get_commodity_items(db: Session, skip: int = 0, limit: int = 100, kategori: str = None):
    query = db.query(models.CommodityItem)
    if kategori:
        query = query.filter(models.CommodityItem.kategori == kategori)
    return query.order_by(models.CommodityItem.nama.asc()).offset(skip).limit(limit).all()


def create_commodity_item(db: Session, data: schemas.CommodityItemCreate):
    db_item = models.CommodityItem(**data.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_commodity_item(db: Session, item_id: int, data: schemas.CommodityItemCreate):
    db_item = db.query(models.CommodityItem).filter(models.CommodityItem.id == item_id).first()
    if db_item:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item


def delete_commodity_item(db: Session, item_id: int) -> bool:
    db_item = db.query(models.CommodityItem).filter(models.CommodityItem.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
        return True
    return False


def get_or_create_commodity_item(
    db: Session,
    item_name: str,
    unit: str = "kg",
    source_desc: str = "Otomatis ditambahkan dari input barang custom"
) -> models.CommodityItem:
    clean_name = (item_name or "").strip()
    if not clean_name:
        return None
    
    existing = db.query(models.CommodityItem).filter(
        models.CommodityItem.nama.ilike(clean_name)
    ).first()
    if existing:
        return existing
    
    try:
        title_name = clean_name.title()
        new_item = models.CommodityItem(
            nama=title_name,
            kategori="Lainnya",
            satuan_default=(unit or "kg").strip(),
            deskripsi=source_desc,
            is_active=True
        )
        db.add(new_item)
        db.flush()
        return new_item
    except Exception:
        db.rollback()
        return db.query(models.CommodityItem).filter(
            models.CommodityItem.nama.ilike(clean_name)
        ).first()


def submit_market_survey(db: Session, survey: schemas.MarketSurveyCreate):
    results = {"success": 0, "failed": 0, "errors": []}
    shop_name_clean = (survey.shop_name or "").strip()
    region_id_clean = (survey.region_id or "").strip()
    surveyor_clean = (survey.surveyor_name or "").strip() if survey.surveyor_name else None

    for i, item in enumerate(survey.items):
        item_name_clean = (item.item_name or "").strip()
        if not item_name_clean:
            results["failed"] += 1
            results["errors"].append(f"Baris {i+1}: Nama barang tidak boleh kosong.")
            continue
        
        if item.reference_price is None or item.reference_price <= 0:
            results["failed"] += 1
            results["errors"].append(f"Baris {i+1} ({item_name_clean}): Harga harus lebih besar dari 0.")
            continue

        unit_clean = (item.unit or "kg").strip()
        commodity_id = item.commodity_item_id

        # Auto-match or auto-create master commodity item
        if not commodity_id:
            comm_item = get_or_create_commodity_item(
                db,
                item_name_clean,
                unit=unit_clean,
                source_desc=f"Otomatis ditambahkan dari survey pasar ({shop_name_clean})"
            )
            if comm_item:
                commodity_id = comm_item.id
                item_name_clean = comm_item.nama

        try:
            db_price = models.MarketPrice(
                item_name=item_name_clean,
                region_id=region_id_clean,
                reference_price=float(item.reference_price),
                unit=unit_clean,
                shop_name=shop_name_clean,
                price_date=survey.survey_date,
                supplier_name=(item.supplier_name or "").strip() if item.supplier_name else None,
                survey_session_id=(survey.survey_session_id or "").strip(),
                notes=(item.notes or "").strip() if item.notes else None,
                commodity_item_id=commodity_id,
                surveyor_name=surveyor_clean
            )
            db.add(db_price)
            db.commit()
            results["success"] += 1
        except Exception as e:
            db.rollback()
            results["failed"] += 1
            results["errors"].append(f"Baris {i+1} ({item_name_clean}): {str(e)}")
    
    # Log survey to audit_logs
    try:
        db.execute(
            text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"),
            {
                "action": "MARKET_SURVEY",
                "table": "market_prices",
                "id": None,
                "details": f"Survey {survey.survey_session_id}: {results['success']} item tersimpan di {shop_name_clean}, {region_id_clean}"
            }
        )
        db.commit()
    except Exception:
        db.rollback()
    
    return results


def get_commodity_prices(db: Session, item_name: str = None, date_from: date = None, date_to: date = None,
                          region: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.MarketPrice)
    if item_name:
        query = query.filter(models.MarketPrice.item_name.ilike(f"%{item_name}%"))
    if date_from:
        query = query.filter(models.MarketPrice.price_date >= date_from)
    if date_to:
        query = query.filter(models.MarketPrice.price_date <= date_to)
    if region:
        query = query.filter(models.MarketPrice.region_id.ilike(f"%{region}%"))
    return query.order_by(models.MarketPrice.price_date.desc(), models.MarketPrice.created_at.desc()).offset(skip).limit(limit).all()


def get_latest_prices(db: Session):
    # Get the latest price for each item_name using a subquery
    subq = db.query(
        models.MarketPrice.item_name,
        func.max(models.MarketPrice.price_date).label('max_date')
    ).group_by(models.MarketPrice.item_name).subquery()
    
    latest = db.query(models.MarketPrice).join(
        subq,
        and_(
            models.MarketPrice.item_name == subq.c.item_name,
            models.MarketPrice.price_date == subq.c.max_date
        )
    ).all()
    
    # Deduplicate: for items with multiple entries on same date, take the latest created_at
    seen = {}
    for p in latest:
        key = p.item_name
        if key not in seen or p.created_at > seen[key].created_at:
            seen[key] = p
    
    result = []
    for item_name in sorted(seen.keys()):
        p = seen[item_name]
        result.append(schemas.LatestPriceResponse(
            item_name=p.item_name,
            reference_price=float(p.reference_price),
            unit=p.unit,
            price_date=p.price_date,
            shop_name=p.shop_name,
            region_id=p.region_id,
            supplier_name=p.supplier_name
        ))
    return result


def get_price_stats(db: Session, item_name: str, period_start: date = None, period_end: date = None):
    if not period_end:
        period_end = date.today()
    if not period_start:
        from datetime import timedelta
        period_start = period_end - timedelta(days=90)
    
    prices = db.query(models.MarketPrice).filter(
        models.MarketPrice.item_name.ilike(item_name),
        models.MarketPrice.price_date >= period_start,
        models.MarketPrice.price_date <= period_end
    ).order_by(models.MarketPrice.price_date.asc()).all()
    
    if not prices:
        return None
    
    all_prices_vals = [p.reference_price for p in prices]
    current_price = all_prices_vals[-1]
    
    # Get previous period for comparison
    from datetime import timedelta
    prev_start = period_start - timedelta(days=(period_end - period_start).days)
    prev_prices = db.query(models.MarketPrice).filter(
        models.MarketPrice.item_name.ilike(item_name),
        models.MarketPrice.price_date >= prev_start,
        models.MarketPrice.price_date < period_start
    ).order_by(models.MarketPrice.price_date.desc()).all()
    
    previous_price = prev_prices[0].reference_price if prev_prices else None
    price_change = current_price - previous_price if previous_price else None
    price_change_pct = ((current_price - previous_price) / previous_price * 100) if previous_price and previous_price > 0 else None
    
    return schemas.MarketPriceStats(
        item_name=prices[0].item_name,
        current_price=current_price,
        previous_price=previous_price,
        price_change=price_change,
        price_change_pct=price_change_pct,
        min_price=min(all_prices_vals),
        max_price=max(all_prices_vals),
        avg_price=sum(all_prices_vals) / len(all_prices_vals),
        data_points=len(all_prices_vals),
        period_start=period_start,
        period_end=period_end
    )


# --- SMART AUDIT & POTENTIAL LOSS DETECTION CRUD ---

def get_survey_sessions(db: Session):
    sessions = db.query(
        models.MarketPrice.survey_session_id,
        func.max(models.MarketPrice.shop_name).label('shop_name'),
        func.max(models.MarketPrice.region_id).label('region_id'),
        func.max(models.MarketPrice.price_date).label('price_date'),
        func.max(models.MarketPrice.surveyor_name).label('surveyor_name'),
        func.count(models.MarketPrice.id).label('item_count'),
        func.sum(models.MarketPrice.reference_price).label('total_value'),
        func.max(models.MarketPrice.created_at).label('latest_created')
    ).filter(
        models.MarketPrice.survey_session_id.isnot(None)
    ).group_by(
        models.MarketPrice.survey_session_id
    ).order_by(func.max(models.MarketPrice.created_at).desc()).all()

    result = []
    for s in sessions:
        result.append(schemas.SurveySessionSummary(
            survey_session_id=s.survey_session_id,
            shop_name=s.shop_name,
            region_id=s.region_id,
            survey_date=s.price_date,
            surveyor_name=s.surveyor_name,
            item_count=s.item_count,
            total_value=float(s.total_value or 0),
            created_at=s.latest_created,
        ))
    return result


def get_survey_session_items(db: Session, session_id: str):
    return db.query(models.MarketPrice).filter(
        models.MarketPrice.survey_session_id == session_id
    ).order_by(models.MarketPrice.id.asc()).all()


def delete_survey_session(db: Session, session_id: str) -> bool:
    items = db.query(models.MarketPrice).filter(
        models.MarketPrice.survey_session_id == session_id
    ).all()
    if not items:
        return False
    for item in items:
        db.delete(item)
    db.commit()
    return True


def update_market_price_entry(db: Session, price_id: int, data: schemas.MarketPriceUpdate):
    db_mp = db.query(models.MarketPrice).filter(models.MarketPrice.id == price_id).first()
    if not db_mp:
        return None
    if data.item_name is not None:
        db_mp.item_name = data.item_name
    if data.reference_price is not None:
        db_mp.reference_price = data.reference_price
    if data.unit is not None:
        db_mp.unit = data.unit
    if data.supplier_name is not None:
        db_mp.supplier_name = data.supplier_name
    if data.notes is not None:
        db_mp.notes = data.notes
    if data.commodity_item_id is not None:
        db_mp.commodity_item_id = data.commodity_item_id
    db.commit()
    db.refresh(db_mp)
    return db_mp


def delete_market_price_entry(db: Session, price_id: int) -> bool:
    db_mp = db.query(models.MarketPrice).filter(models.MarketPrice.id == price_id).first()
    if not db_mp:
        return False
    db.delete(db_mp)
    db.commit()
    return True


def get_market_prices(db: Session):
    return db.query(models.MarketPrice).order_by(models.MarketPrice.item_name.asc()).all()

def create_or_update_market_price(db: Session, price_data: schemas.MarketPriceCreate):
    # Fallback to today if date is not provided
    p_date = price_data.price_date or date.today()
    item_name_clean = (price_data.item_name or "").strip()
    unit_clean = (price_data.unit or "kg").strip()

    commodity_id = price_data.commodity_item_id
    if not commodity_id and item_name_clean:
        comm_item = get_or_create_commodity_item(
            db,
            item_name_clean,
            unit=unit_clean,
            source_desc="Otomatis ditambahkan dari input harga acuan"
        )
        if comm_item:
            commodity_id = comm_item.id
            item_name_clean = comm_item.nama
    
    # Check if there is an exact match for item_name, shop_name, and price_date
    db_mp = db.query(models.MarketPrice).filter(
        models.MarketPrice.item_name.ilike(item_name_clean),
        models.MarketPrice.shop_name == price_data.shop_name,
        models.MarketPrice.price_date == p_date
    ).first()
    
    if db_mp:
        db_mp.reference_price = price_data.reference_price
        db_mp.unit = unit_clean
        db_mp.region_id = price_data.region_id
        db_mp.supplier_name = price_data.supplier_name
        db_mp.notes = price_data.notes
        db_mp.commodity_item_id = commodity_id
        if price_data.surveyor_name:
            db_mp.surveyor_name = price_data.surveyor_name
    else:
        # Create a new record (records price history point!)
        db_mp = models.MarketPrice(
            item_name=item_name_clean,
            region_id=price_data.region_id,
            reference_price=price_data.reference_price,
            unit=unit_clean,
            shop_name=price_data.shop_name,
            price_date=p_date,
            supplier_name=price_data.supplier_name,
            survey_session_id=price_data.survey_session_id,
            notes=price_data.notes,
            commodity_item_id=commodity_id,
            surveyor_name=price_data.surveyor_name
        )
        db.add(db_mp)
    db.commit()
    db.refresh(db_mp)
    return db_mp

def get_market_price_history(db: Session, item_name: str, date_from: date = None, date_to: date = None):
    query = db.query(models.MarketPrice).filter(
        models.MarketPrice.item_name.ilike(item_name)
    )
    if date_from:
        query = query.filter(models.MarketPrice.price_date >= date_from)
    if date_to:
        query = query.filter(models.MarketPrice.price_date <= date_to)
    return query.order_by(models.MarketPrice.price_date.asc()).all()

def find_market_price(db: Session, item_name: str) -> models.MarketPrice:
    normalized_name = item_name.strip().lower()
    
    # Query all reference prices sorted by price_date desc, created_at desc
    # This guarantees that if there are multiple entries (history), we match the latest active reference price!
    market_prices = db.query(models.MarketPrice).order_by(
        models.MarketPrice.price_date.desc(),
        models.MarketPrice.created_at.desc()
    ).all()
    
    # 1. Exact match (case insensitive)
    for mp in market_prices:
        if mp.item_name.lower().strip() == normalized_name:
            return mp
            
    # 2. Substring match: Is the database price item name inside the receipt item name?
    # e.g., db price "Beras" matches receipt "Beras Cianjur Kepala"
    best_match = None
    for mp in market_prices:
        mp_name = mp.item_name.lower().strip()
        if mp_name in normalized_name:
            if not best_match or len(mp_name) > len(best_match.item_name):
                best_match = mp
                
    if best_match:
        return best_match
        
    # 3. Substring match: Is the receipt item name inside the database price item name?
    # e.g., receipt "Bawang" matches db price "Bawang Merah"
    for mp in market_prices:
        mp_name = mp.item_name.lower().strip()
        if normalized_name in mp_name:
            if not best_match or len(mp_name) < len(best_match.item_name):
                best_match = mp
                
    return best_match

def create_audit_report(db: Session, doc_url: str, extracted_items: list, user_id: str = None, sppg_id: int = None) -> models.AuditReport:
    total_potential_loss = 0.0
    total_items = 0
    db_items = []
    
    max_markup = 0.0
    
    for item in extracted_items:
        item_name = (item.get("item_name") or "").strip()
        if not item_name:
            continue
        qty = float(item.get("qty", 1.0))
        price_per_unit = float(item.get("price_per_unit", 0.0))
        unit = (item.get("unit") or "kg").strip()
        
        # Match with reference price
        matched_mp = find_market_price(db, item_name)
        if matched_mp:
            market_price = matched_mp.reference_price
        else:
            # Fallback: if not found, assume market price is equal to the bill price (0 markup, 0 loss)
            market_price = price_per_unit
            
        # Automatically add custom item to Master Komoditas if not exists
        comm_item = get_or_create_commodity_item(
            db,
            item_name,
            unit=unit,
            source_desc="Otomatis ditambahkan dari Smart Audit (OCR scan)"
        )
        if comm_item:
            item_name = comm_item.nama
            # If no market price reference exists for this custom item, create initial default reference entry
            if not matched_mp and price_per_unit > 0:
                try:
                    default_mp = models.MarketPrice(
                        item_name=comm_item.nama,
                        region_id="Kecamatan Sikur",
                        reference_price=price_per_unit,
                        unit=unit,
                        shop_name="Smart Audit OCR",
                        price_date=date.today(),
                        commodity_item_id=comm_item.id,
                        notes="Otomatis ditambahkan dari hasil scan Smart Audit"
                    )
                    db.add(default_mp)
                    db.flush()
                except Exception:
                    pass

        # Calculation: potential loss and markup
        potential_loss_item = 0.0
        markup_pct = 0.0
        if price_per_unit > market_price and market_price > 0:
            markup_pct = ((price_per_unit - market_price) / market_price) * 100
            potential_loss_item = (price_per_unit - market_price) * qty
            
        total_potential_loss += potential_loss_item
        total_items += 1
        
        if markup_pct > max_markup:
            max_markup = markup_pct
            
        db_items.append(
            models.AuditItem(
                item_name=item_name,
                qty=qty,
                price_per_unit=price_per_unit,
                market_price=market_price,
                potential_loss=potential_loss_item
            )
        )
        
    # Classify overall risk status based on max item markup:
    # Safe (<5% markup) -> NORMAL
    # Warning (5-15% markup) -> WARNING
    # Danger (>15% markup) -> DANGER
    if max_markup > 15.0:
        report_status = "DANGER"
    elif max_markup >= 5.0:
        report_status = "WARNING"
    else:
        report_status = "NORMAL"
        
    # Create the report with sppg_id and created_by_user_id
    db_report = models.AuditReport(
        doc_url=doc_url,
        total_items=total_items,
        total_potential_loss=total_potential_loss,
        status=report_status,
        sppg_id=sppg_id,
        created_by_user_id=user_id
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    # Add detail items
    for db_item in db_items:
        db_item.audit_report_id = db_report.id
        db.add(db_item)
        
    db.commit()
    db.refresh(db_report)
    
    # Record scan in the system's Audit Log
    try:
        db.execute(
            text("INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES (:uid, :action, :table, :id, :details)"),
            {
                "uid": user_id,
                "action": "AUDIT_SCAN",
                "table": "audit_reports",
                "id": db_report.id,
                "details": f"Scan RAB/Nota: {total_items} items, total potential loss: Rp {total_potential_loss:,.2f}, status: {report_status}"
            }
        )
        db.commit()
    except Exception as e:
        logger_err = logging.getLogger("sppg_audit_ocr")
        logger_err.error(f"Failed to insert audit log entry: {str(e)}")
        db.rollback()
        
    return db_report

def get_audit_reports(db: Session, user: models.Profile = None):
    query = db.query(models.AuditReport)
    
    # Scoping for bound non-global roles
    if user and user.role in ['sppg_head', 'nutrition_inspector', 'finance_inspector']:
        if user.sppg_id:
            query = query.filter(
                (models.AuditReport.sppg_id == user.sppg_id) |
                (models.AuditReport.created_by_user_id == user.id)
            )
        else:
            query = query.filter(models.AuditReport.created_by_user_id == user.id)
            
    reports = query.order_by(models.AuditReport.created_at.desc()).all()
    
    for r in reports:
        if r.sppg:
            r.sppg_name = r.sppg.nama
        elif r.sppg_id:
            unit = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == r.sppg_id).first()
            r.sppg_name = unit.nama if unit else None
        else:
            r.sppg_name = None
            
    return reports

def get_audit_report(db: Session, report_id: int, user: models.Profile = None):
    report = db.query(models.AuditReport).filter(models.AuditReport.id == report_id).first()
    if not report:
        return None
        
    if user and user.role in ['sppg_head', 'nutrition_inspector', 'finance_inspector']:
        if user.sppg_id and report.sppg_id and report.sppg_id != user.sppg_id:
            if report.created_by_user_id != user.id:
                return None
                
    if report.sppg:
        report.sppg_name = report.sppg.nama
    elif report.sppg_id:
        unit = db.query(models.SPPGUnit).filter(models.SPPGUnit.id == report.sppg_id).first()
        report.sppg_name = unit.nama if unit else None
        
    return report

def delete_audit_report(db: Session, report_id: int) -> bool:
    db_report = db.query(models.AuditReport).filter(models.AuditReport.id == report_id).first()
    if db_report:
        db.delete(db_report)
        db.commit()
        
        # Log deletion in Audit Log
        try:
            db.execute(
                text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"),
                {
                    "action": "AUDIT_DELETE",
                    "table": "audit_reports",
                    "id": report_id,
                    "details": f"Deleted audit report ID {report_id}"
                }
            )
            db.commit()
        except Exception:
            db.rollback()
        return True
    return False


def get_dashboard_stats(db: Session):
    # SPPG counts by status
    sppg_all = db.query(models.SPPGUnit).all()
    total_sppg = len(sppg_all)
    sppg_aktif = sum(1 for s in sppg_all if s.status_operasional and s.status_operasional.lower() == 'aktif')
    sppg_nonaktif = sum(1 for s in sppg_all if s.status_operasional and 'tidak' in s.status_operasional.lower())
    sppg_maintenance = total_sppg - sppg_aktif - sppg_nonaktif

    # Kelompok & sasaran
    kelompoks = db.query(models.KelompokPenerima).all()
    total_kelompok = len(kelompoks)
    kelompok_terlayani = sum(1 for k in kelompoks if k.assigned_sppg_id is not None)
    kelompok_belum_terlayani = total_kelompok - kelompok_terlayani

    total_sasaran = db.query(
        func.coalesce(func.sum(models.KelompokDetail.porsi_kecil), 0) +
        func.coalesce(func.sum(models.KelompokDetail.porsi_besar), 0) +
        func.coalesce(func.sum(models.KelompokDetail.jumlah_busui), 0) +
        func.coalesce(func.sum(models.KelompokDetail.jumlah_bumil), 0) +
        func.coalesce(func.sum(models.KelompokDetail.jumlah_balita_non_paud), 0)
    ).select_from(models.KelompokDetail).scalar() or 0

    # Top SPPG by raport scores (average of all 10 categories)
    score_cols = [
        models.SPPGUnit.infrastruktur_score,
        models.SPPGUnit.peralatan_score,
        models.SPPGUnit.k3_lingkungan_score,
        models.SPPGUnit.paket_mbg_score,
        models.SPPGUnit.distribusi_score,
        models.SPPGUnit.dokumentasi_score,
        models.SPPGUnit.penerima_manfaat_score,
        models.SPPGUnit.tenaga_kerja_score,
        models.SPPGUnit.sertifikat_iso_score,
        models.SPPGUnit.administrasi_score,
    ]
    avg_expr = sum(score_cols) / len(score_cols)

    top_sppg_raw = db.query(
        models.SPPGUnit.id,
        models.SPPGUnit.nama,
        models.SPPGUnit.kode_sppg,
        models.SPPGUnit.alamat_desa,
        avg_expr.label('rata_rata_score')
    ).order_by(avg_expr.desc()).limit(5).all()

    top_sppg = [
        schemas.SPPGRaportSummary(
            id=s.id, nama=s.nama, kode_sppg=s.kode_sppg,
            alamat_desa=s.alamat_desa, rata_rata_score=round(float(s.rata_rata_score), 1)
        ) for s in top_sppg_raw
    ]

    return schemas.DashboardStats(
        total_sppg=total_sppg,
        sppg_aktif=sppg_aktif,
        sppg_nonaktif=sppg_nonaktif,
        sppg_maintenance=sppg_maintenance,
        total_kelompok=total_kelompok,
        total_sasaran=total_sasaran,
        kelompok_terlayani=kelompok_terlayani,
        kelompok_belum_terlayani=kelompok_belum_terlayani,
        top_sppg=top_sppg,
    )


def delete_market_price(db: Session, price_id: int) -> bool:
    db_mp = db.query(models.MarketPrice).filter(models.MarketPrice.id == price_id).first()
    if db_mp:
        item_name = db_mp.item_name
        db.delete(db_mp)
        db.commit()
        
        # Log deletion in Audit Log
        try:
            db.execute(
                text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"),
                {
                    "action": "PRICE_DELETE",
                    "table": "market_prices",
                    "id": price_id,
                    "details": f"Deleted reference market price for {item_name}"
                }
            )
            db.commit()
        except Exception:
            db.rollback()
        return True
    return False



