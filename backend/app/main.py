from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import engine, get_db
from .dependencies import coordinator_only, admin_only
import logging
import os
from dotenv import load_dotenv

# Load .env from root
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SPPG Mapping System API")

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
    print(f"DEBUG: verify_kelompok called for ID: {id}, Status: {status}")
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
