from sqlalchemy.orm import Session
from sqlalchemy import func, asc, text
from . import models, schemas
import os
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
    return db.query(models.Profile).filter(models.Profile.id == user_id).first()

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
    return db.query(models.Profile).all()

def update_user(db: Session, user_id: str, profile: schemas.ProfileBase):
    db_profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if db_profile:
        update_data = profile.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_profile, key, value)
        db.commit()
        db.refresh(db_profile)
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
        db_profile = models.Profile(id=user_id, full_name=user_data.full_name, role=user_data.role)
        db.add(db_profile)
    else:
        db_profile.full_name = user_data.full_name
        db_profile.role = user_data.role
    
    db.commit()
    db.refresh(db_profile)
    
    db.execute(text("INSERT INTO audit_logs (action, target_table, target_id, details) VALUES (:action, :table, :id, :details)"), 
               {"action": "CREATE_USER", "table": "profiles", "id": None, "details": f"Created new user {user_data.full_name} with role {user_data.role} ({user_id})"})
    db.commit()
    
    return db_profile
