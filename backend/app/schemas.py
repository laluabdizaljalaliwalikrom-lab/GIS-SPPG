from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Union
from datetime import date
from uuid import UUID

class SPPGUnitBase(BaseModel):
    kode_sppg: str
    nama: str
    alamat_desa: str
    status_operasional: str
    tanggal_operasional: date
    nama_kepala: str
    pengawas_keuangan: str
    pengawas_gizi: str
    pic_yayasan: str
    nama_yayasan: str
    kapasitas_produksi: int
    lat: float
    lng: float

class SPPGUnitCreate(SPPGUnitBase):
    pass

class SPPGUnitResponse(SPPGUnitBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class KelompokDetailBase(BaseModel):
    porsi_kecil: Optional[int] = 0
    porsi_besar: Optional[int] = 0
    jumlah_guru: Optional[int] = 0
    jumlah_tendik: Optional[int] = 0
    jumlah_busui: Optional[int] = 0
    jumlah_bumil: Optional[int] = 0
    jumlah_balita_non_paud: Optional[int] = 0
    jumlah_kader: Optional[int] = 0

class KelompokPenerimaBase(BaseModel):
    jenis_kelompok: str
    kode_kelompok: str
    nama: str
    jenis_kepemilikan: str
    alamat_lengkap: str
    pj_nama: str
    no_whatsapp: str
    email: str
    status: Optional[str] = 'pending_verification'
    lat: float
    lng: float
    assigned_sppg_id: Optional[int] = None
    
class KelompokPenerimaCreate(KelompokPenerimaBase):
    detail: KelompokDetailBase

class KelompokDetailResponse(KelompokDetailBase):
    id: int
    kelompok_id: int
    model_config = ConfigDict(from_attributes=True)

class KelompokPenerimaResponse(KelompokPenerimaBase):
    id: int
    detail: Optional[KelompokDetailResponse] = None
    model_config = ConfigDict(from_attributes=True)

class AllocationRequest(BaseModel):
    pass

class ManualAssignRequest(BaseModel):
    group_id: int
    sppg_id: int

class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    role: str

class UserCreate(ProfileBase):
    email: str
    password: str

class ProfileResponse(ProfileBase):
    id: Union[str, UUID]
    model_config = ConfigDict(from_attributes=True)
