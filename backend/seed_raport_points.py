import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL") or "postgresql+psycopg2://sppg_user:sppg_password@db:5432/sppg_db"

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL and "postgresql://" in DATABASE_URL and "+psycopg2" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
from app import models

try:
    print(f"Connecting to database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    # Try to create all tables (only works if dialect supports it or if we are connecting to Postgres/SpatiaLite)
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Metadata create_all warning (might be SQLite without SpatiaLite): {e}")

    new_columns = [
        "peralatan_score",
        "k3_lingkungan_score",
        "paket_mbg_score",
        "distribusi_score",
        "dokumentasi_score",
        "penerima_manfaat_score",
        "tenaga_kerja_score",
        "sertifikat_iso_score",
        "administrasi_score"
    ]

    # 1. Database Migration: Add columns if they don't exist
    with engine.connect() as conn:
        # Check if database is SQLite or PostgreSQL
        is_sqlite = "sqlite" in str(engine.url)
        print(f"Database dialect is SQLite: {is_sqlite}")
        
        for col in new_columns:
            try:
                if is_sqlite:
                    # SQLite ALTER TABLE check
                    res = conn.execute(text(f"PRAGMA table_info(sppg_units)"))
                    cols = [r[1] for r in res.fetchall()]
                    if col not in cols:
                        print(f"Adding column {col} to sppg_units (SQLite)...")
                        conn.execute(text(f"ALTER TABLE sppg_units ADD COLUMN {col} INTEGER DEFAULT 0"))
                else:
                    # PostgreSQL ALTER TABLE with IF NOT EXISTS
                    print(f"Adding column {col} to sppg_units if not exists (Postgres)...")
                    conn.execute(text(f"ALTER TABLE sppg_units ADD COLUMN IF NOT EXISTS {col} INTEGER DEFAULT 0"))
                conn.commit()
            except Exception as e:
                print(f"Error adding column {col}: {e}")

    # 2. Seeding raport_points
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print("Clearing existing raport checklist answers and points...")
        session.execute(text("DELETE FROM sppg_point_answers"))
        session.execute(text("DELETE FROM raport_points"))
        session.commit()
    except Exception as e:
        print(f"Error clearing tables: {e}")
        session.rollback()

    seed_data = [
        # Category: infrastruktur (Bangunan & Infrastruktur)
        ("infrastruktur", "Luas Lahan > 600 M2"),
        ("infrastruktur", "Luas Bangunan > 300 M2"),
        ("infrastruktur", "Tidak Berada < 500 Meter Sumber Pencemaran"),
        ("infrastruktur", "Bebas Banjir dan Terlindungi dari Serangga dan Tikus"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Gas Terbuka"),
        ("infrastruktur", "Pembagian Ruangan: Gudang Penyimpanan Bahan Pangan Basah"),
        ("infrastruktur", "Pembagian Ruangan: Gudang Penyimpanan Bahan Pangan Kering"),
        ("infrastruktur", "Pembagian Ruangan: Gudang Peralatan Makanan"),
        ("infrastruktur", "Pembagian Ruangan: Gudang Peralatan Memasak"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Cuci Bahan Makanan"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Produksi Basah"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Produksi Kering"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Food Inspection"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Food Preparation"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Pemorsian"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Distribusi"),
        ("infrastruktur", "Pembagian Ruangan: Area Loading dan Unloading"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Pencucian Alat Masak"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Pencucian Alat Makan"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Konsultasi Pelaporan Keamanan Pangan"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Tempat Tinggal Kepala SPPG, Ahli Gizi dan Akuntan (PKK)"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Karyawan (Tersedia ruang khusus istirahat & ibadah)"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Administrasi"),
        ("infrastruktur", "Pembagian Ruangan: Ruang Toilet Terpisah dan sesuai jumlah karyawan"),
        ("infrastruktur", "Pembagian Ruangan: Area parkir kendaraan jauh dari pintu masuk bangunan pengolahan pangan"),
        ("infrastruktur", "Lantai Kedap Air, Kering, Bersih"),
        ("infrastruktur", "Lantai dilapisi epoxy and Konus (melengkung/tidak tajam)"),
        ("infrastruktur", "Lantai dilengkapi Grease Strap (pemisah lemak, minyak dan air)"),
        ("infrastruktur", "Dinding dilapisi Bahan Kedap Air (2 Meter dari Lantai)"),
        ("infrastruktur", "Ventilasi Udara anti serangga (Exhaust/AC terawat, berfungsi & bersih)"),
        ("infrastruktur", "Pencahayaan/Penerangan tersebar merata, min 10 fc pada Bidang Area Kerja"),
        ("infrastruktur", "Atap tidak bocor dan tidak jadi Sarang Tikus/Serangga"),
        ("infrastruktur", "Langit-langit minimal 2,4 meter dari lantai"),
        ("infrastruktur", "Pintu dipasang alat penahan kontaminasi (plastik/air curtain/bebas vektor)"),
        ("infrastruktur", "Wastafel dengan air mengalir, sabun cuci dan pengering tangan"),
        ("infrastruktur", "Tempat Memasak terpisah Secara Jelas dengan Tempat Penyimpanan Makanan"),
        ("infrastruktur", "Tata letak peralatan sesuai alur pengelolaan pangan (persiapan - pengolahan - pemorsian)"),
        ("infrastruktur", "Terdapat Sungkup/penyedot udara dan Cerobong Asap"),
        ("infrastruktur", "Bagian dinding yang terkena percikan air/minyak dilapisi bahan kedap air/minyak"),
        ("infrastruktur", "Tidak ada genangan air (struktur lantai landai ke arah pembuangan) dan terdapat saluran pembuangan"),
        ("infrastruktur", "Dapur: Bagian lantai dilengkapi Grease Strap (pemisah lemak, minyak dan air)"),
        ("infrastruktur", "Dapur: Terdapat Pesan Higiene"),
        ("infrastruktur", "Gudang: Terdapat Rak/Pallet Penempatan Bahan Baku Pangan (jarak 15cm dari lantai, 5cm dari dinding, 60cm dari langit-langit)"),
        ("infrastruktur", "Gudang: Tidak Terdapat Bahan Lain selain Bahan Baku Pangan"),
        ("infrastruktur", "Gudang: Tertutup Rapat dari Serangga dan Tikus serta tidak ada retakan dinding"),
        ("infrastruktur", "Gudang: Pemisahan Gudang Basah dan Gudang Kering"),
        ("infrastruktur", "Gudang: Tidak terkondensasi air yang jatuh langsung dari bahan pangan"),
        ("infrastruktur", "Gudang: Kondisi langit-langit bersih, tidak bocor dan tertutup rapat"),
        ("infrastruktur", "Gudang: Identitas Bahan kimia Non Pangan tercantum jelas dan Tidak mencampur Bahan Kimia non Pangan di Gudang"),
        ("infrastruktur", "Gudang: Terdapat area/ruangan khusus Bahan Kimia Non Pangan (tidak menyatu dengan pangan)"),
        ("infrastruktur", "Area Penyimpanan: Bahan Mentah dari hewan disimpan pada suhu <4°C"),
        ("infrastruktur", "Area Penyimpanan: Suhu Gudang Bahan Kering <25°C"),
        ("infrastruktur", "Area Penyimpanan: Suhu Chiller pada suhu <4°C"),
        ("infrastruktur", "Area Penyimpanan: Suhu Freezer <18°C (untuk bahan pangan baku tidak langsung digunakan)"),
        ("infrastruktur", "Area Penyimpanan: Chiller dan Freezer tidak digunakan untuk penyimpan pangan mentah and matang bersebelahan"),
        ("infrastruktur", "Area Penyimpanan: Rekaman monitoring suhu Freezer and Chiller/alat pengukur suhu"),
        ("infrastruktur", "Area Monitoring: Area Dokumentasi dan informasi Monitoring dan Rekaman Penyaluran"),
        ("infrastruktur", "Area Monitoring: LCD Monitoring Rekaman Produksi dan Penyaluran"),

        # Category: peralatan (Peralatan)
        ("peralatan", "Peralatan Masak/Dapur: Tidak terbuat dari kayu (contoh: talenan, alat pengaduk)"),
        ("peralatan", "Peralatan Masak/Dapur: Peralatan Masak dibedakan/dipisah untuk Pangan Matang dan Pangan Mentah"),
        ("peralatan", "Peralatan Masak/Dapur: Untuk Peralatan masak sekali pakai, tidak boleh dipakai ulang dan food grade"),
        ("peralatan", "Peralatan Masak/Dapur: Alat pengering peralatan selalu bersih, dicuci dan diganti rutin setiap hari"),
        ("peralatan", "Peralatan Makanan: Ompreng dan alat makan terbuat dari Stainless Steel 304 tebal 6 cm, food grade, tidak berkarat"),
        ("peralatan", "Peralatan Makanan: Pembersihan Alat Makanan dibuat dalam 3 bak pencucian (air panas dan dingin)"),
        ("peralatan", "Peralatan Makanan: Detergen/produk pembersih kimia diberi label, disimpan jauh dari makanan"),
        ("peralatan", "Peralatan Penunjang: Genset/instalasi Listrik"),
        ("peralatan", "Peralatan Penunjang: Pemasangan Papan Nama SPPG"),
        ("peralatan", "Peralatan Penunjang: Penanda Ruang Area SPPG"),
        ("peralatan", "Peralatan Penunjang: Instalasi Gas"),
        ("peralatan", "Peralatan Penunjang: Termometer (Ruangan & Celup)"),
        ("peralatan", "Peralatan Penunjang: Timbangan industri"),
        ("peralatan", "Peralatan Penunjang: Timbangan Digital Dapur"),
        ("peralatan", "Peralatan Penunjang: Loker Karyawan (posisi tidak menyebabkan kontaminasi silang)"),

        # Category: k3_lingkungan (K3 & Kesehatan Lingkungan)
        ("k3_lingkungan", "IPAL: Memiliki Saluran Pembuangan limbah dapur dilengkapi dengan penangkap lemak (Grease trap)"),
        ("k3_lingkungan", "IPAL: Memiliki Tandon/Bak Penampungan Limbah"),
        ("k3_lingkungan", "IPAL: Memiliki Tandon Air Bersih"),
        ("k3_lingkungan", "IPAL: Air untuk pencucian/kontak pangan sesuai standar kualitas air minum/diolah"),
        ("k3_lingkungan", "IPAL: Terdapat sistem Drainase di area luar"),
        ("k3_lingkungan", "K3: Tersedia alat pemadam api ringan (APAR) gas disertai petunjuk jelas dan tanggal kedaluwarsa"),
        ("k3_lingkungan", "K3: Tersedia Peralatan P3K dan obat-obatan yang tidak Kedaluarsa"),
        ("k3_lingkungan", "K3: Tersedia Personil Penanggung Jawab APAR dan Peralatan K3"),
        ("k3_lingkungan", "K3: Alat Pelindung Diri (APD) lengkap"),
        ("k3_lingkungan", "K3: Menerapkan Kawasan Tanpa Rokok (KTR)"),
        ("k3_lingkungan", "K3: Petunjuk Call Emergency Kebakaran dan Keracunan"),
        ("k3_lingkungan", "K3: Petunjuk Jalur Evakuasi yang jelas ke arah titik Kumpul"),
        ("k3_lingkungan", "Sampah & Limbah: Tempat sampah tertutup, bersih, terletak min 10 meter dari dapur/makanan"),
        ("k3_lingkungan", "Sampah & Limbah: Sampah dipisahkan berdasarkan jenis dan dibuang minimal 1x dalam 24 jam"),
        ("k3_lingkungan", "Sampah & Limbah: Jalur pengangkutan sampah harus terpisah dari jalur distribusi makanan"),

        # Category: paket_mbg (Paket Program MBG)
        ("paket_mbg", "Perencanaan Menu: Sesuai Acuan Kecukupan Gizi (AKG) BGN/Juknis MBG (Permenkes no. 28 tahun 2019)"),
        ("paket_mbg", "Perencanaan Menu: Mengutamakan bahan pangan aman, lokal dan fortifikasi (garam yodium)"),
        ("paket_mbg", "Perencanaan Menu: Mengakomodasi kesukaan dan ketidaksukaan anak"),
        ("paket_mbg", "Perencanaan Menu: Menghindari Bahan Makanan yang Memicu Alergi"),
        ("paket_mbg", "Estimasi Harga: Menghitung Kebutuhan Bahan Pangan berdasarkan Berat Bersih dan Kotor"),
        ("paket_mbg", "Estimasi Harga: Menentukan Estimasi Harga Menu dengan Harga Bahan Pangan Lokal"),
        ("paket_mbg", "Estimasi Harga: Menghitung Food cost dengan menambahkan 10% untuk bumbu"),
        ("paket_mbg", "Standart Gizi: 20-25 % kecukupan Gizi untuk makanan pagi"),
        ("paket_mbg", "Standart Gizi: 30-35 % kecukupan Gizi untuk makan siang"),
        ("paket_mbg", "Standart Gizi: Memenuhi AKG sasaran umur sesuai standart MBG (Permenkes 28/2019)"),
        ("paket_mbg", "Menu Porsi: Terdiri Makanan Pokok, Sayuran, Lauk Pauk dan Buah"),
        ("paket_mbg", "Menu Porsi: Menu bervariasi sesuai selera manfaat dan memenuhi standart Gizi BGN"),
        ("paket_mbg", "Menu Porsi: Penambahan menu Susu rendah Gula, Garam dan Lemak (2 hari sekali)"),
        ("paket_mbg", "Menu Porsi: Mengganti bahan alergenik dengan bahan gizi serupa (susu kedelai)"),
        ("paket_mbg", "Menu Porsi: Porsi Menu sesuai dengan Sasaran Edukasi Gizi (Anak, Hamil, Menyusui, Balita)"),
        ("paket_mbg", "Bahan Baku: Pengecekan Stok Bahan Baku (FIFO/FEFO), pemberian stiker label"),
        ("paket_mbg", "Bahan Baku: QC Bahan Baku tidak tercemar pestisida dan kimia lainnya"),
        ("paket_mbg", "Bahan Baku: Bahan makanan dipilah sesuai penyimpanan; Kaleng cacat/bocor ditolak"),
        ("paket_mbg", "Bahan Baku: Tempat wadah/container pengiriman bahan segera dibuang"),
        ("paket_mbg", "Bahan Baku: Tidak Menggunakan Makanan Sisa sebagai bahan pangan untuk diolah kembali"),
        ("paket_mbg", "Bahan Baku: Buah/sayur segar langsung dikonsumsi dicuci air standar air minum"),
        ("paket_mbg", "Bahan Baku: Pengadaan Bahan bekerjasama dengan Koperasi Desa, BUMDes, Gapoktan, dll."),
        ("paket_mbg", "Mutu & Keamanan: Menerapkan 5 Kunci Keamanan Pangan WHO"),
        ("paket_mbg", "Mutu & Keamanan: Thawing bahan beku dengan cara aman"),
        ("paket_mbg", "Mutu & Keamanan: Memisahkan bahan mentah, siap masak, dan siap saji"),
        ("paket_mbg", "Mutu & Keamanan: Mencuci buah and sayur segar sebelum disajikan"),
        ("paket_mbg", "Mutu & Keamanan: Menghitung sisa makanan baik dari tiap foodtray maupun secara bulky"),
        ("paket_mbg", "Mutu & Keamanan: Menggunakan telenan/tatakan berbeda untuk menghindari kontaminasi silang"),
        ("paket_mbg", "Penyajian: Wadah yang digunakan ukurannya memadai dengan makanan"),
        ("paket_mbg", "Penyajian: Melakukan uji Organoleptik (tidak ada perubahan bentuk, warna, tekstur, bau)"),
        ("paket_mbg", "Penyajian: Semua peralatan yang digunakan hygienis, utuh, tidak cacat/rusak"),

        # Category: distribusi (Penyaluran & Distribusi)
        ("distribusi", "Alat Angkut (Mobil/Motor) Higiene dan Khusus Angkut Makanan"),
        ("distribusi", "Waktu Tempuh Maksimal 30 menit"),
        ("distribusi", "Pengiriman Kloter I Pukul 07.45 (TK, PAUD, SD 1-2)"),
        ("distribusi", "Pengiriman Kloter II Pukul 09.00 (SD Kelas 3-6)"),
        ("distribusi", "Pengiriman Kloter III Pukul 10.00 - 12.00 (SMP, SMA)"),
        ("distribusi", "Pengambilan Alat Makanan (13.30 - 15.00)"),
        ("distribusi", "Jalur pengangkutan tidak satu jalur dengan jalur pengangkutan sampah"),
        ("distribusi", "Alat Angkut (Mobil/Motor) senantiasa dicuci air dengan sabun"),

        # Category: dokumentasi (Dokumentasi & Monitoring)
        ("dokumentasi", "Menyimpan Sampel Makanan Hasil Produksi 2x24 jam di chiller <5°C terpisah"),
        ("dokumentasi", "Melakukan Dokumentasi Menu Makanan Setiap Pengiriman"),
        ("dokumentasi", "Membuat Informasi Monitoring dan Rekaman Penyaluran dan Produksi"),
        ("dokumentasi", "Menampilkan Rekaman Data Sasaran Penyaluran/Produksi di Area Informasi"),
        ("dokumentasi", "Melakukan Koordinasi Deteksi Dini & Pengawasan Gejala Keracunan Pangan"),

        # Category: penerima_manfaat (Penerima Manfaat)
        ("penerima_manfaat", "Jumlah Penerima Manfaat >3000"),
        ("penerima_manfaat", "Radius Penerima Manfaat (max Radius 6 KM)"),
        ("penerima_manfaat", "Penerima Manfaat mencakup Siswa SD"),
        ("penerima_manfaat", "Penerima Manfaat mencakup Siswa SMP"),
        ("penerima_manfaat", "Penerima Manfaat mencakup Siswa SMA"),
        ("penerima_manfaat", "Penerima Manfaat mencakup Santri"),
        ("penerima_manfaat", "Penerima Hamil (2 hari sekali)"),
        ("penerima_manfaat", "Penerima Ibu Menyusui (2 hari sekali)"),
        ("penerima_manfaat", "Penerima Posyandu/Anak Balita (2 hari sekali)"),
        ("penerima_manfaat", "Penerima TK PAUD"),

        # Category: tenaga_kerja (Tenaga Kerja)
        ("tenaga_kerja", "Tenaga Lokal Desa (30-45 pekerja)"),
        ("tenaga_kerja", "Memiliki Ahli Gizi"),
        ("tenaga_kerja", "Memiliki PPK"),
        ("tenaga_kerja", "Memiliki Administrasi"),

        # Category: sertifikat_iso (Sertifikat & ISO)
        ("sertifikat_iso", "Sertifikat Hazard Analisis Critical and Control Points (HACCP)"),
        ("sertifikat_iso", "Sertifikat Nomor Kontrol Veteriner (NKV)"),
        ("sertifikat_iso", "Sertifikat Pelatihan Keamanan Pangan Siap Saji (HSP) bagi Penjamah & Relawan"),
        ("sertifikat_iso", "Sertifikat Laik Higiene Sanitasi (SLHS)"),
        ("sertifikat_iso", "Sertifikat Halal"),
        ("sertifikat_iso", "ISO 22000: Food Safety Management System"),
        ("sertifikat_iso", "ISO 45001:2018 Occupational Health and Safety Management System"),

        # Category: administrasi (Administrasi & Keuangan)
        ("administrasi", "Tersedia dokumen Rencana Anggaran Biaya (RAB)"),
        ("administrasi", "Memiliki Dokumen SOP (SOP Pencucian, Peralatan, Pemorsian, Higiene, dll)"),
        ("administrasi", "Dokumen Perencanaan Menu"),
        ("administrasi", "Tersedia Kuitansi transaksi yang lengkap"),
        ("administrasi", "Memiliki Rekening Bersama Virtual Account"),
        ("administrasi", "Tersedia Nota Pesanan yang teratur"),
        ("administrasi", "FORM Pemeriksaan Bahan Makanan diisi dengan tertib"),
        ("administrasi", "FORM Pemeriksaaan Makanan diisi dengan tertib"),
        ("administrasi", "Tersedia Laporan Pelaksanaan yang berkala"),
        ("administrasi", "Tersedia Dokumentasi dan Informasi Monitoring serta Rekaman Penyaluran")
    ]

    print(f"Seeding {len(seed_data)} points...")
    for category, text_content in seed_data:
        session.execute(
            text("INSERT INTO raport_points (category, text) VALUES (:category, :text)"),
            {"category": category, "text": text_content}
        )

    session.commit()
    session.close()
    print("Database seeding completed successfully!")
except Exception as main_e:
    print(f"\n[IMPORTANT] Database operations failed: {main_e}")
    print("This is normal in sandbox environment due to network/Supabase offline state.")
    print("Please run this script manually using: python seed_raport_points.py in the backend directory on your machine.")
