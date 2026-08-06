from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Union
from datetime import date, datetime
from uuid import UUID

class SurveyInputItem(BaseModel):
    commodity_item_id: Optional[int] = None
    item_name: str = Field(..., min_length=1)
    reference_price: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1)
    qty: Optional[float] = Field(1.0, gt=0)
    supplier_name: Optional[str] = None
    notes: Optional[str] = None


class MarketSurveyCreate(BaseModel):
    survey_session_id: str = Field(..., min_length=1)
    survey_date: date
    region_id: str = Field(..., min_length=1)
    shop_name: str = Field(..., min_length=1)
    surveyor_name: Optional[str] = None
    items: List[SurveyInputItem] = Field(..., min_items=1)

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
    peralatan_score: Optional[int] = 0
    k3_lingkungan_score: Optional[int] = 0
    paket_mbg_score: Optional[int] = 0
    distribusi_score: Optional[int] = 0
    dokumentasi_score: Optional[int] = 0
    penerima_manfaat_score: Optional[int] = 0
    tenaga_kerja_score: Optional[int] = 0
    sertifikat_iso_score: Optional[int] = 0
    administrasi_score: Optional[int] = 0
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
    sppg_id: Optional[int] = None

class UserCreate(ProfileBase):
    email: str
    password: str

class ProfileResponse(ProfileBase):
    id: Union[str, UUID]
    sppg_name: Optional[str] = None
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


class CommodityItemBase(BaseModel):
    nama: str
    kategori: Optional[str] = None
    satuan_default: str
    deskripsi: Optional[str] = None
    is_active: Optional[bool] = True


class CommodityItemCreate(CommodityItemBase):
    pass


class CommodityItemResponse(CommodityItemBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MarketPriceBase(BaseModel):
    item_name: str
    region_id: Optional[str] = None
    reference_price: float
    unit: str
    shop_name: Optional[str] = None
    price_date: Optional[date] = None
    supplier_name: Optional[str] = None
    survey_session_id: Optional[str] = None
    notes: Optional[str] = None
    commodity_item_id: Optional[int] = None
    surveyor_name: Optional[str] = None


class MarketPriceCreate(MarketPriceBase):
    pass


class MarketPriceResponse(MarketPriceBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MarketPriceStats(BaseModel):
    item_name: str
    current_price: float
    previous_price: Optional[float] = None
    price_change: Optional[float] = None
    price_change_pct: Optional[float] = None
    min_price: float
    max_price: float
    avg_price: float
    data_points: int
    period_start: date
    period_end: date


class LatestPriceResponse(BaseModel):
    item_name: str
    reference_price: float
    unit: str
    price_date: date
    shop_name: Optional[str] = None
    region_id: Optional[str] = None
    supplier_name: Optional[str] = None


class SurveySessionSummary(BaseModel):
    survey_session_id: str
    shop_name: Optional[str] = None
    region_id: Optional[str] = None
    survey_date: Optional[date] = None
    surveyor_name: Optional[str] = None
    item_count: int
    total_value: float
    created_at: Optional[datetime] = None

class MarketPriceUpdate(BaseModel):
    item_name: Optional[str] = None
    reference_price: Optional[float] = None
    unit: Optional[str] = None
    supplier_name: Optional[str] = None
    notes: Optional[str] = None
    commodity_item_id: Optional[int] = None


class MarketSurveyExcelRow(BaseModel):
    item_name: str
    reference_price: float
    unit: str = "kg"
    shop_name: Optional[str] = None
    region_id: Optional[str] = None
    supplier_name: Optional[str] = None
    notes: Optional[str] = None


class MarketSurveyExcelImportRequest(BaseModel):
    region_id: Optional[str] = "Sikur"
    shop_name: Optional[str] = None
    survey_date: date
    surveyor_name: Optional[str] = None
    rows: List[MarketSurveyExcelRow]


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
    sppg_id: Optional[int] = None
    created_by_user_id: Optional[Union[str, UUID]] = None


class AuditReportResponse(AuditReportBase):
    id: int
    created_at: datetime
    sppg_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class AuditReportDetailResponse(AuditReportResponse):
    items: List[AuditItemResponse]
    model_config = ConfigDict(from_attributes=True)


class SPPGRaportSummary(BaseModel):
    id: int
    nama: str
    kode_sppg: str
    alamat_desa: str
    rata_rata_score: float

class DashboardStats(BaseModel):
    total_sppg: int
    sppg_aktif: int
    sppg_nonaktif: int
    sppg_maintenance: int
    total_kelompok: int
    total_sasaran: int
    kelompok_terlayani: int
    kelompok_belum_terlayani: int
    top_sppg: List[SPPGRaportSummary]


class DisperindagLivePriceResponse(BaseModel):
    komoditas: str
    kategori: str
    harga_ntb: float
    satuan: str
    perubahan: float
    status_tren: str
    wilayah: str
    pasar_acuan: str
    tanggal_update: str


