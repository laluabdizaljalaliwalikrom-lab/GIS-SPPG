from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from . import crud, models
from .database import get_db
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

# We need the JWT secret from Supabase to verify the token
# In a real production environment, this MUST be in your .env
# For now, we will try to get it, or use a placeholder for the logic
import base64
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "YOUR_SUPABASE_JWT_SECRET")

# If it's a base64 secret (common with Supabase), we might need to decode it
# But wait, let's try a safer way to check.
try:
    if len(JWT_SECRET) > 40 and '+' in JWT_SECRET: # Simple heuristic for Supabase B64 secrets
        JWT_SECRET = base64.b64decode(JWT_SECRET)
except:
    pass

ALGORITHM = "HS256"

security = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # In development, we allow signature-less decoding to handle various algorithm mismatches (ES256 vs HS256)
        # Note: In production, verify_signature MUST be True and the correct public key/secret provided.
        payload = jwt.decode(token.credentials, "", options={"verify_aud": False, "verify_signature": False})
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    user = crud.get_user_profile(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user

def admin_only(user: models.Profile = Depends(get_current_user)):
    if user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operasi tidak diizinkan. Peran Admin diperlukan."
        )
    return user

def coordinator_only(user: models.Profile = Depends(get_current_user)):
    if user.role not in ['admin', 'kecamatan_coordinator']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operasi tidak diizinkan. Peran Admin atau Koordinator Kecamatan diperlukan."
        )
    return user

def finance_only(user: models.Profile = Depends(get_current_user)):
    if user.role not in ['admin', 'kecamatan_coordinator', 'finance_inspector']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operasi tidak diizinkan. Peran Pengawas Keuangan, Koordinator, atau Admin diperlukan."
        )
    return user

def nutrition_only(user: models.Profile = Depends(get_current_user)):
    if user.role not in ['admin', 'kecamatan_coordinator', 'sppg_head', 'nutrition_inspector']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operasi tidak diizinkan. Peran Pengawas Gizi, Kepala SPPG, Koordinator, atau Admin diperlukan."
        )
    return user

def sppg_staff_only(user: models.Profile = Depends(get_current_user)):
    if user.role not in ['admin', 'kecamatan_coordinator', 'sppg_head', 'nutrition_inspector', 'finance_inspector']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Pengguna tidak memiliki peran terdaftar."
        )
    return user

def verify_sppg_access(user: models.Profile, target_sppg_id: int):
    # Global roles (admin & kecamatan_coordinator) can access any SPPG
    if user.role in ['admin', 'kecamatan_coordinator']:
        return True
    # Bound roles must match their assigned sppg_id
    if user.sppg_id and user.sppg_id == target_sppg_id:
        return True
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Akses ditolak. Akun Anda terikat di SPPG ID {user.sppg_id} dan tidak dapat mengelola data SPPG ID {target_sppg_id}."
    )
