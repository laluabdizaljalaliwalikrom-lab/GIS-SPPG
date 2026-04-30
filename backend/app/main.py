from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import engine, get_db
import logging

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
def read_sppgs(db: Session = Depends(get_db)):
    return crud.get_sppgs(db)

@app.post("/api/sppg", response_model=schemas.SPPGUnitResponse)
def create_sppg(sppg: schemas.SPPGUnitCreate, db: Session = Depends(get_db)):
    db_sppg = crud.create_sppg(db, sppg)
    # Re-fetch with parsed lat/lng
    sppgs = crud.get_sppgs(db)
    for s in sppgs:
        if s.id == db_sppg.id:
            return s
    raise HTTPException(status_code=500, detail="Failed to fetch created SPPG")

@app.get("/api/kelompok", response_model=list[schemas.KelompokPenerimaResponse])
def read_kelompoks(db: Session = Depends(get_db)):
    return crud.get_kelompoks(db)

@app.post("/api/kelompok", response_model=schemas.KelompokPenerimaResponse)
def create_kelompok(kelompok: schemas.KelompokPenerimaCreate, db: Session = Depends(get_db)):
    db_k = crud.create_kelompok(db, kelompok)
    # Re-fetch
    kelompoks = crud.get_kelompoks(db)
    for k in kelompoks:
        if k.id == db_k.id:
            return k
    raise HTTPException(status_code=500, detail="Failed to fetch created Kelompok")

@app.put("/api/sppg/{sppg_id}", response_model=schemas.SPPGUnitResponse)
def update_sppg(sppg_id: int, sppg: schemas.SPPGUnitCreate, db: Session = Depends(get_db)):
    return crud.update_sppg(db, sppg_id, sppg)

@app.delete("/api/sppg/{sppg_id}")
def delete_sppg(sppg_id: int, db: Session = Depends(get_db)):
    crud.delete_sppg(db, sppg_id)
    return {"status": "success"}

@app.put("/api/kelompok/{kelompok_id}", response_model=schemas.KelompokPenerimaResponse)
def update_kelompok(kelompok_id: int, kelompok: schemas.KelompokPenerimaCreate, db: Session = Depends(get_db)):
    return crud.update_kelompok(db, kelompok_id, kelompok)

@app.delete("/api/kelompok/{kelompok_id}")
def delete_kelompok(kelompok_id: int, db: Session = Depends(get_db)):
    crud.delete_kelompok(db, kelompok_id)
    return {"status": "success"}

@app.post("/api/kelompok/{kelompok_id}/verify")
def verify_kelompok(kelompok_id: int, req: dict, db: Session = Depends(get_db)):
    return crud.verify_kelompok(db, kelompok_id, req.get("status"))

@app.post("/api/assign-manual")
def assign_manual(req: schemas.ManualAssignRequest, db: Session = Depends(get_db)):
    return crud.assign_manual(db, req)

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
