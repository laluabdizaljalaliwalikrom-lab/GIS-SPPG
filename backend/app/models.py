# Force reload models
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Boolean, DateTime, Text, func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry, Geography
from .database import Base



class SPPGUnit(Base):
    __tablename__ = "sppg_units"

    id = Column(Integer, primary_key=True, index=True)
    kode_sppg = Column(String, unique=True, index=True)
    nama = Column(String)
    alamat_desa = Column(String)
    # Using Geography(POINT, srid=4326)
    geom = Column(Geography('POINT', srid=4326))
    status_operasional = Column(String)
    tanggal_operasional = Column(Date)
    nama_kepala = Column(String)
    pengawas_keuangan = Column(String, nullable=True)
    pengawas_gizi = Column(String, nullable=True)
    pic_yayasan = Column(String, nullable=True)
    nama_yayasan = Column(String, nullable=True)
    kapasitas_produksi = Column(Integer)
    
    # Raport fields
    infrastruktur_score = Column(Integer, default=0)
    peralatan_score = Column(Integer, default=0)
    k3_lingkungan_score = Column(Integer, default=0)
    paket_mbg_score = Column(Integer, default=0)
    distribusi_score = Column(Integer, default=0)
    dokumentasi_score = Column(Integer, default=0)
    penerima_manfaat_score = Column(Integer, default=0)
    tenaga_kerja_score = Column(Integer, default=0)
    sertifikat_iso_score = Column(Integer, default=0)
    administrasi_score = Column(Integer, default=0)
    sdm_score = Column(Integer, default=0)
    kepuasan_score = Column(Integer, default=0)

    # Relationship back to KelompokPenerima
    kelompok_penerima = relationship("KelompokPenerima", back_populates="sppg")
    answers = relationship("SPPGPointAnswer", back_populates="sppg", cascade="all, delete-orphan")

class KelompokPenerima(Base):
    __tablename__ = "kelompok_penerima"

    id = Column(Integer, primary_key=True, index=True)
    jenis_kelompok = Column(String) # 'School' or 'Posyandu'
    kode_kelompok = Column(String, unique=True, index=True)
    nama = Column(String)
    jenis_kepemilikan = Column(String) # 'Negeri' or 'Swasta'
    alamat_lengkap = Column(String)
    geom = Column(Geography('POINT', srid=4326))
    pj_nama = Column(String)
    no_whatsapp = Column(String)
    email = Column(String)
    status = Column(String, default='pending_verification')
    
    assigned_sppg_id = Column(Integer, ForeignKey("sppg_units.id"), nullable=True)

    sppg = relationship("SPPGUnit", back_populates="kelompok_penerima")
    detail = relationship("KelompokDetail", back_populates="kelompok", uselist=False, cascade="all, delete-orphan")

class KelompokDetail(Base):
    __tablename__ = "kelompok_detail"

    id = Column(Integer, primary_key=True, index=True)
    kelompok_id = Column(Integer, ForeignKey("kelompok_penerima.id"), unique=True)
    
    # Fields for School
    porsi_kecil = Column(Integer, nullable=True)
    porsi_besar = Column(Integer, nullable=True)
    jumlah_guru = Column(Integer, nullable=True)
    jumlah_tendik = Column(Integer, nullable=True)
    
    # Fields for Posyandu
    jumlah_busui = Column(Integer, nullable=True)
    jumlah_bumil = Column(Integer, nullable=True)
    jumlah_balita_non_paud = Column(Integer, nullable=True)
    jumlah_kader = Column(Integer, nullable=True)

    kelompok = relationship("KelompokPenerima", back_populates="detail")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, index=True) # Matches Supabase Auth UUID
    full_name = Column(String)
    role = Column(String) # 'admin', 'kecamatan_coordinator', 'sppg_head', 'nutrition_inspector', 'finance_inspector'
    sppg_id = Column(Integer, ForeignKey("sppg_units.id"), nullable=True)

    sppg = relationship("SPPGUnit", foreign_keys=[sppg_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True) # UUID as String
    action = Column(String, nullable=False)
    target_table = Column(String, nullable=False)
    target_id = Column(Integer, nullable=True)
    details = Column(String)
    created_at = Column(Date)

class RaportPoint(Base):
    __tablename__ = "raport_points"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String) # 'infrastruktur', 'sdm', 'kepuasan'
    text = Column(String)

class SPPGPointAnswer(Base):
    __tablename__ = "sppg_point_answers"
    id = Column(Integer, primary_key=True, index=True)
    sppg_id = Column(Integer, ForeignKey("sppg_units.id"))
    point_id = Column(Integer, ForeignKey("raport_points.id"))
    is_fulfilled = Column(Boolean, default=False)

    sppg = relationship("SPPGUnit", back_populates="answers")
    point = relationship("RaportPoint")


class CommodityItem(Base):
    __tablename__ = "commodity_items"

    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String, unique=True, nullable=False, index=True)
    kategori = Column(String, nullable=True)
    satuan_default = Column(String, nullable=False)
    deskripsi = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, index=True, nullable=False)
    region_id = Column(String, nullable=True)
    reference_price = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    shop_name = Column(String, nullable=True)
    price_date = Column(Date, nullable=False, server_default=func.current_date())
    supplier_name = Column(String, nullable=True)
    survey_session_id = Column(String, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    commodity_item_id = Column(Integer, ForeignKey("commodity_items.id"), nullable=True)
    surveyor_name = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    commodity = relationship("CommodityItem", foreign_keys=[commodity_item_id])


class AuditReport(Base):
    __tablename__ = "audit_reports"

    id = Column(Integer, primary_key=True, index=True)
    doc_url = Column(String, nullable=True)
    total_items = Column(Integer, default=0)
    total_potential_loss = Column(Float, default=0.0)
    status = Column(String, default="NORMAL") # 'NORMAL' | 'WARNING' | 'DANGER'
    sppg_id = Column(Integer, ForeignKey("sppg_units.id"), nullable=True)
    created_by_user_id = Column(String, ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    items = relationship("AuditItem", back_populates="report", cascade="all, delete-orphan")
    sppg = relationship("SPPGUnit", foreign_keys=[sppg_id])


class AuditItem(Base):
    __tablename__ = "audit_items"

    id = Column(Integer, primary_key=True, index=True)
    audit_report_id = Column(Integer, ForeignKey("audit_reports.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String, nullable=False)
    qty = Column(Float, default=1.0)
    price_per_unit = Column(Float, nullable=False)
    market_price = Column(Float, nullable=False)
    potential_loss = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())

    report = relationship("AuditReport", back_populates="items")


