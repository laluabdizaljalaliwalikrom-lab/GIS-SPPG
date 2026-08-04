from app.database import SessionLocal
from app.models import CommodityItem

db = SessionLocal()

# List of comprehensive standard commodities for SPPG
COMPREHENSIVE_COMMODITIES = [
    # Makanan Pokok / Karbohidrat
    {"nama": "Beras Medium", "kategori": "Beras", "satuan_default": "kg", "deskripsi": "Beras standar kualitas medium untuk konsumsi harian MBG"},
    {"nama": "Beras Premium", "kategori": "Beras", "satuan_default": "kg", "deskripsi": "Beras mutu tinggi pulen untuk menu khusus"},
    {"nama": "Beras Merah", "kategori": "Beras", "satuan_default": "kg", "deskripsi": "Beras kaya serat & gizi tinggi"},
    {"nama": "Jagung Pipilan", "kategori": "Beras", "satuan_default": "kg", "deskripsi": "Jagung kuning pipilan kering / giling"},
    {"nama": "Kentang Segar", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Kentang olahan karbohidrat pengganti/pendamping"},
    {"nama": "Ubi Kayu (Singkong)", "kategori": "Lainnya", "satuan_default": "kg", "deskripsi": "Singkong segar olahan kudapan bergizi"},
    {"nama": "Ubi Jalar", "kategori": "Lainnya", "satuan_default": "kg", "deskripsi": "Ubi jalar manis kaya karoten"},
    {"nama": "Mie Telur", "kategori": "Lainnya", "satuan_default": "pack", "deskripsi": "Mie olahan gandum & telur"},
    {"nama": "Bihun / Soun", "kategori": "Lainnya", "satuan_default": "pack", "deskripsi": "Bihun beras olahan sup/tumis"},
    {"nama": "Tepung Terigu", "kategori": "Bumbu", "satuan_default": "kg", "deskripsi": "Tepung gandum bahan olahan roti/kue"},
    {"nama": "Tepung Tapioka", "kategori": "Bumbu", "satuan_default": "kg", "deskripsi": "Tepung singkong pengental / pengolah bakso"},

    # Protein Hewani
    {"nama": "Daging Ayam Broiler", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Daging ayam segar karkas utuh/potong"},
    {"nama": "Daging Ayam Kampung", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Daging ayam lokal tinggi protein"},
    {"nama": "Daging Sapi Segar", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Daging sapi murni paha/gandik segar"},
    {"nama": "Daging Sapi Cincang", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Daging sapi giling olahan bakso/sup"},
    {"nama": "Telur Ayam Ras", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Telur ayam ras segar utama program MBG"},
    {"nama": "Telur Ayam Kampung", "kategori": "Lauk", "satuan_default": "butir", "deskripsi": "Telur lokal tinggi gizi"},
    {"nama": "Telur Bebek", "kategori": "Lauk", "satuan_default": "butir", "deskripsi": "Telur bebek mentah/asin"},
    {"nama": "Ikan Tongkol Segar", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Ikan laut kaya omega-3 khas NTB"},
    {"nama": "Ikan Kembung", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Ikan laut tinggi kalsium & omega-3"},
    {"nama": "Ikan Nila Segar", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Ikan air tawar konsumsi sup/goreng"},
    {"nama": "Ikan Mujair", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Ikan air tawar lokal segar"},
    {"nama": "Ikan Bandeng", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Ikan gurih tinggi protein"},
    {"nama": "Udang Segar", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Udang laut/tambak segar pelengkap sup"},

    # Protein Nabati
    {"nama": "Tahu Putih Segar", "kategori": "Lauk", "satuan_default": "pcs", "deskripsi": "Tahu olahan kedelai segar"},
    {"nama": "Tempe Segar", "kategori": "Lauk", "satuan_default": "papan", "deskripsi": "Tempe fermented soybean segar bergizi"},
    {"nama": "Kacang Hijau", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Kacang hijau olahan bubur gizi anak"},
    {"nama": "Kacang Merah", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Kacang merah kaya zat besi & serat"},
    {"nama": "Kacang Tanah", "kategori": "Lauk", "satuan_default": "kg", "deskripsi": "Kacang tanah bumbu & camilan bergizi"},

    # Sayur-Mayur
    {"nama": "Sayur Bayam", "kategori": "Sayur", "satuan_default": "ikat", "deskripsi": "Bayam segar tinggi zat besi & asam folat"},
    {"nama": "Sayur Kangkung", "kategori": "Sayur", "satuan_default": "ikat", "deskripsi": "Kangkung segar kaya vitamin A"},
    {"nama": "Sayur Wortel", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Wortel oranye segar kaya beta-karoten"},
    {"nama": "Sayur Buncis", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Buncis muda manis pelengkap tumisan"},
    {"nama": "Sayur Kacang Panjang", "kategori": "Sayur", "satuan_default": "ikat", "deskripsi": "Kacang panjang segar tumis/gulai"},
    {"nama": "Sayur Kubis / Kol", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Kol kubis segar untuk sup/tumis"},
    {"nama": "Sayur Sawi Hijau", "kategori": "Sayur", "satuan_default": "ikat", "deskripsi": "Sawi hijau kaya vitamin C & K"},
    {"nama": "Sayur Terong", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Terong ungu/hijau olahan sayur"},
    {"nama": "Sayur Labu Siam", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Labu siam segar penyegar sup"},
    {"nama": "Sayur Tomat", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Tomat merah segar kaya likopen"},
    {"nama": "Sayur Daun Kelor", "kategori": "Sayur", "satuan_default": "ikat", "deskripsi": "Daun kelor superfood lokal kaya kalsium"},
    {"nama": "Sayur Brokoli", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Brokoli hijau segar kaya antioksidan"},
    {"nama": "Sayur Kembang Kol", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Kembang kol segar pelengkap sup gizi"},

    # Buah-Buahan Gizi
    {"nama": "Pisang Ambon / Raja", "kategori": "Sayur", "satuan_default": "sisir", "deskripsi": "Pisang segar sumber kalium & energi pencuci mulut"},
    {"nama": "Jeruk Manis", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Jeruk buah kaya vitamin C"},
    {"nama": "Pepaya Segar", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Pepaya matang manis pelancar pencernaan"},
    {"nama": "Semangka", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Semangka segar penyegar hidangan"},
    {"nama": "Melon", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Melon manis potongan porsi buah"},
    {"nama": "Apel Segar", "kategori": "Sayur", "satuan_default": "kg", "deskripsi": "Apel merah/hijau buah porsi"},

    # Susu & Olahan Gizi
    {"nama": "Susu UHT 200ml", "kategori": "Susu", "satuan_default": "pcs", "deskripsi": "Susu cair UHT kemasan 200ml per anak"},
    {"nama": "Susu UHT 125ml", "kategori": "Susu", "satuan_default": "pcs", "deskripsi": "Susu cair UHT kemasan 125ml porsi PAUD/TK"},
    {"nama": "Susu Bubuk Full Cream", "kategori": "Susu", "satuan_default": "box", "deskripsi": "Susu bubuk bernutrisi tinggi"},
    {"nama": "Keju Cheddar", "kategori": "Susu", "satuan_default": "block", "deskripsi": "Keju cheddar olahan kalsium tinggi"},

    # Bumbu & Rempah
    {"nama": "Bawang Merah", "kategori": "Bumbu", "satuan_default": "kg", "deskripsi": "Bawang merah segar lokal Sikur/NTB"},
    {"nama": "Bawang Putih", "kategori": "Bumbu", "satuan_default": "kg", "deskripsi": "Bawang putih kating/honan bumbu masakan"},
    {"nama": "Cabai Merah Besar", "kategori": "Bumbu", "satuan_default": "kg", "deskripsi": "Cabai merah segar pewarna & penyedap alami"},
    {"nama": "Cabai Rawit", "kategori": "Bumbu", "satuan_default": "kg", "deskripsi": "Cabai rawit merah/hijau lokal"},
    {"nama": "Garam Beryodium", "kategori": "Bumbu", "satuan_default": "pack", "deskripsi": "Garam dapur beryodium penambah cita rasa"},
    {"nama": "Gula Pasir", "kategori": "Bumbu", "satuan_default": "kg", "deskripsi": "Gula pasir putih konsumsi"},
    {"nama": "Gula Merah / Kelapa", "kategori": "Bumbu", "satuan_default": "kg", "deskripsi": "Gula merah asli pemanis masakan tradisional"},
    {"nama": "Merica / Lada Bubuk", "kategori": "Bumbu", "satuan_default": "pack", "deskripsi": "Lada bubuk penyedap rempah"},
    {"nama": "Kecap Manis", "kategori": "Bumbu", "satuan_default": "botol", "deskripsi": "Kecap manis kedelai hitam olahan masakan"},

    # Minyak & Lemak
    {"nama": "Minyak Goreng Sawit", "kategori": "Minyak", "satuan_default": "liter", "deskripsi": "Minyak goreng kelapa sawit olahan tumis/goreng"},
    {"nama": "Margarin / Mentega", "kategori": "Minyak", "satuan_default": "pack", "deskripsi": "Margarin kaya vitamin A pengolah masakan"},

    # Gas & Kebutuhan Dapur
    {"nama": "Gas LPG 3kg", "kategori": "Gas", "satuan_default": "tabung", "deskripsi": "Tabung gas LPG 3kg bersubsidi"},
    {"nama": "Gas LPG 12kg", "kategori": "Gas", "satuan_default": "tabung", "deskripsi": "Tabung gas LPG 12kg nonsubsidi skala dapur SPPG"},
    {"nama": "Air Mineral Galon", "kategori": "Air", "satuan_default": "galon", "deskripsi": "Air mineral galon konsumsi minum dapur SPPG"},
]

inserted = 0
updated = 0

for item in COMPREHENSIVE_COMMODITIES:
    existing = db.query(CommodityItem).filter(CommodityItem.nama.ilike(item["nama"])).first()
    if existing:
        existing.kategori = item["kategori"]
        existing.satuan_default = item["satuan_default"]
        existing.deskripsi = item["deskripsi"]
        existing.is_active = True
        updated += 1
    else:
        new_item = CommodityItem(
            nama=item["nama"],
            kategori=item["kategori"],
            satuan_default=item["satuan_default"],
            deskripsi=item["deskripsi"],
            is_active=True
        )
        db.add(new_item)
        inserted += 1

db.commit()
total_items = db.query(CommodityItem).count()
print(f"SEEDED COMMODITIES SUCCESSFULLY!")
print(f"Inserted: {inserted} | Updated: {updated} | Total in DB: {total_items}")

db.close()
