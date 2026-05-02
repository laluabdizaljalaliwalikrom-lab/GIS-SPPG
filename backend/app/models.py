# Force reload models
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
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

    # Relationship back to KelompokPenerima
    kelompok_penerima = relationship("KelompokPenerima", back_populates="sppg")

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
    role = Column(String)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True) # UUID as String
    action = Column(String, nullable=False)
    target_table = Column(String, nullable=False)
    target_id = Column(Integer, nullable=True)
    details = Column(String)
    created_at = Column(Date)
