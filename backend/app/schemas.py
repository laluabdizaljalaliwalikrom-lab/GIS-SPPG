from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Union
from datetime import date, datetime
from uuid import UUID

class SPPGUnitBase(BaseModel):
    kode_sppg: str
    nama: str
    alamat_desa: str
    status_operasional: str
    tanggal_operasional: date
    nama_kepala: str
    pengawas_keuangan: Optional[str] = None
    pengawas_gizi: Optional[str] = None
    pic_yayasan: Optional[str] = None
    nama_yayasan: Optional[str] = None
    kapasitas_produksi: int
    lat: float
    lng: float
    infrastruktur_score: Optional[int] = 0
    sdm_score: Optional[int] = 0
    kepuasan_score: Optional[int] = 0

class SPPGUnitCreate(SPPGUnitBase):
    pass

class SPPGUnitResponse(SPPGUnitBase):
    id: int
    remaining_capacity: Optional[int] = 0
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
    sppg_id: Optional[int] = None

class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    role: str

class UserCreate(ProfileBase):
    email: str
    password: str

class ProfileResponse(ProfileBase):
    id: Union[str, UUID]
    model_config = ConfigDict(from_attributes=True)

class RaportPointBase(BaseModel):
    category: str
    text: str

class RaportPointCreate(RaportPointBase):
    pass

class RaportPointResponse(RaportPointBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SPPGPointAnswerBase(BaseModel):
    point_id: int
    is_fulfilled: bool

class SPPGPointAnswerCreate(SPPGPointAnswerBase):
    sppg_id: int

class SPPGPointAnswerResponse(SPPGPointAnswerBase):
    id: int
    sppg_id: int
    model_config = ConfigDict(from_attributes=True)

class SPPGChecklistUpdate(BaseModel):
    answers: List[SPPGPointAnswerBase]


class MarketPriceBase(BaseModel):
    item_name: str
    region_id: Optional[str] = None
    reference_price: float
    unit: str
    shop_name: Optional[str] = None
    price_date: Optional[date] = None


class MarketPriceCreate(MarketPriceBase):
    pass


class MarketPriceResponse(MarketPriceBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AuditItemBase(BaseModel):
    item_name: str
    qty: float
    price_per_unit: float
    market_price: float
    potential_loss: float


class AuditItemResponse(AuditItemBase):
    id: int
    audit_report_id: int
    model_config = ConfigDict(from_attributes=True)


class AuditReportBase(BaseModel):
    doc_url: Optional[str] = None
    total_items: int
    total_potential_loss: float
    status: str


class AuditReportResponse(AuditReportBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AuditReportDetailResponse(AuditReportResponse):
    items: List[AuditItemResponse]
    model_config = ConfigDict(from_attributes=True)


