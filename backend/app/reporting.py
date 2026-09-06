"""Official LHA-style audit report generator (BPKP / APIP format).

Builds a PDF report for an audit_reports record using reportlab. The report
contains:
  1. Kop surat (instansi configurable from system_settings)
  2. Nomor, tanggal, perihal
  3. Ikhtisar / executive summary
  4. Pendahuluan (dasar, tujuan, ruang lingkup, metodologi)
  5. Hasil pemeriksaan (rincian tabel per item)
  6. Temuan & analisis naratif (Kondisi - Kriteria - Penyebab - Akibat + Rekomendasi)
  7. Simpulan & rekomendasi umum
  8. Pengesahan / tanda tangan (teks + gambar ttd opsional)
"""
import re
from datetime import date, datetime, timezone
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    Image,
    HRFlowable,
    KeepTogether,
)


# ---------------------------------------------------------------------------
# Helpers (currency words, dates, numbers)
# ---------------------------------------------------------------------------
def rupiah(value: float) -> str:
    try:
        v = float(value or 0)
    except (ValueError, TypeError):
        v = 0.0
    neg = "-" if v < 0 else ""
    return f"{neg}Rp {abs(v):,.0f}".replace(",", ".")


def terbilang(value: float) -> str:
    """Rupiah amount int -> Indonesian words (used in official reporting)."""
    huruf = [
        "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan",
        "sembilan", "sepuluh", "sebelas",
    ]

    def _sebut(n: int) -> str:
        if n < 12:
            return huruf[n]
        if n < 20:
            return huruf[n - 10] + " belas"
        if n < 100:
            return huruf[n // 10] + " puluh" + (" " + huruf[n % 10] if n % 10 else "")
        if n < 200:
            return "seratus" + (" " + _sebut(n - 100) if n - 100 else "")
        if n < 1000:
            return huruf[n // 100] + " ratus" + (" " + _sebut(n % 100) if n % 100 else "")
        if n < 2000:
            return "seribu" + (" " + _sebut(n - 1000) if n - 1000 else "")
        if n < 1_000_000:
            return _sebut(n // 1000) + " ribu" + (" " + _sebut(n % 1000) if n % 1000 else "")
        if n < 1_000_000_000:
            return _sebut(n // 1_000_000) + " juta" + (" " + _sebut(n % 1_000_000) if n % 1_000_000 else "")
        if n < 1_000_000_000_000:
            return _sebut(n // 1_000_000_000) + " miliar" + (" " + _sebut(n % 1_000_000_000) if n % 1_000_000_000 else "")
        if n < 1_000_000_000_000_000:
            return _sebut(n // 1_000_000_000_000) + " triliun" + (" " + _sebut(n % 1_000_000_000_000) if n % 1_000_000_000_000 else "")
        return str(n)

    try:
        v = int(float(value or 0))
    except (ValueError, TypeError):
        v = 0
    result = _sebut(abs(v))
    return ("minus " if v < 0 else "") + (result + " rupiah" if result else "nol rupiah")


_MONTHS_ID = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]


def tanggal_indonesia(d) -> str:
    if not d:
        return "-"
    if isinstance(d, str):
        try:
            d = date.fromisoformat(d[:10])
        except ValueError:
            return d
    return f"{d.day} {_MONTHS_ID[d.month]} {d.year}"


def _status_label(status: str) -> str:
    return {
        "NORMAL": "NORMAL (Sesuai)",
        "WARNING": "WARNING (Perlu Kewaspadaan)",
        "DANGER": "DANGER (Berisiko Tinggi)",
    }.get((status or "").upper(), status or "-")


# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
def _styles():
    base = ParagraphStyle("base", fontName="Times-Roman", fontSize=10.5, leading=15, alignment=TA_JUSTIFY)
    title = ParagraphStyle("title", parent=base, fontName="Times-Bold", fontSize=13, leading=17, alignment=TA_CENTER, spaceAfter=2)
    kop = ParagraphStyle("kop", parent=base, fontName="Times-Bold", fontSize=12, leading=16, alignment=TA_CENTER)
    sub = ParagraphStyle("sub", parent=title, fontName="Times-Roman", fontSize=11, leading=15)
    h2 = ParagraphStyle("h2", parent=base, fontName="Times-Bold", fontSize=12, leading=16, spaceBefore=10, spaceAfter=4)
    h3 = ParagraphStyle("h3", parent=base, fontName="Times-Bold", fontSize=11, leading=15, spaceBefore=6, spaceAfter=2)
    meta = ParagraphStyle("meta", parent=base, fontName="Times-Roman", fontSize=10.5, leading=15, alignment=TA_LEFT)
    cell = ParagraphStyle("cell", parent=base, fontSize=9, leading=12, alignment=TA_LEFT)
    cellc = ParagraphStyle("cellc", parent=cell, alignment=TA_CENTER)
    cellr = ParagraphStyle("cellr", parent=cell, alignment=TA_RIGHT)
    th = ParagraphStyle("th", parent=cell, fontName="Times-Bold", alignment=TA_CENTER)
    return locals()


# ---------------------------------------------------------------------------
# Narrative blocks (autogenerated Indonesian analysis)
# ---------------------------------------------------------------------------
def _temuan_narasi(report, items, sppg_name, config):
    """Return list of (heading, paragraphs) for the finding/analysis section."""
    blocks = []
    signif = [it for it in items if (it.potential_loss or 0) > 0]
    signif = sorted(signif, key=lambda x: x.potential_loss, reverse=True)
    no = 0
    nota_ref = ""
    if getattr(report, "nota_date", None):
        nota_ref = f" sesuai tanggal nota/RAB {tanggal_indonesia(report.nota_date)}"
    for it in signif:
        no += 1
        diff = (it.price_per_unit or 0) - (it.market_price or 0)
        pct = 0.0
        if it.market_price and it.market_price > 0:
            pct = (diff / it.market_price) * 100
        unit_txt = (it.unit or "kg").strip() or "satuan"
        ref_date_txt = f" pada {tanggal_indonesia(it.reference_date)}" if getattr(it, "reference_date", None) else ""
        conv_txt = ""
        if getattr(it, "unit_converted", False):
            conv_txt = (" dengan harga acuan yang telah disetarakan dari satuan asal "
                        f"<b>{(it.matched_market_price_id and 'survai pasar') or 'survai pasar'}</b> (asumsi konversi)")
        txt = [
            (
                f"a.{no} Hasil pemeriksaan atas item <b>{it.item_name}</b> pada transaksi belanja{nota_ref} "
                f"menunjukkan adanya selisih harga menurut nota sebesar <b>{rupiah(it.price_per_unit)}</b> atas "
                f"satu satuan {unit_txt}, sedangkan harga acuan pasar sebesar <b>{rupiah(it.market_price)}</b> per "
                f"{unit_txt}{conv_txt}. "
                f"Apabila nilai nota dibandingkan dengan harga acuan pasar, terdapat kenaikan sebesar "
                f"<b>{rupiah(diff)} ({pct:.2f}%)</b> per {unit_txt}, sehingga menimbulkan potensi kerugian "
                f"senilai <b>{rupiah(it.potential_loss)}</b>."
            ),
            (
                f"<b>Kriteria:</b> Sebagai pembanding ditetapkan harga acuan pasar atas komoditas "
                f"<b>{it.item_name}</b> (satuan {unit_txt}) yang bersumber dari survai harga pasar dan data "
                f"rujukan resmi (SP2KP/Disperindag NTB) yang berlaku pada periode pemeriksaan"
                f"{ref_date_txt}, yaitu sebesar <b>{rupiah(it.market_price)}</b> per {unit_txt}."
            ),
            (
                f"<b>Penyebab:</b> Selisih harga tersebut diduga terjadi karena harga pembelian pada nota "
                f"termasuk komponen biaya lain (kemasan/transportasi/retribusi), pemilihan pemasok dengan "
                f"penawaran di atas acuan, atau belum optimalnya proses verifikasi harga akhir pada saat "
                f"pembelian belanja operasional SPPG."
            ),
            (
                f"<b>Akibat:</b> Selisih sebesar {rupiah(diff)} per {unit_txt} pada item {it.item_name} berpotensi "
                f"menimbulkan pemborosan anggaran / kerugian negara dan daerah sebesar "
                f"<b>{rupiah(it.potential_loss)}</b> ({terbilang(it.potential_loss)}), jika dibiarkan tanpa "
                f"tindak lanjut koreksi atas pembayaran."
            ),
            (
                f"<b>Rekomendasi:</b> Kepada pengelola SPPG agar melakukan verifikasi ulang atas nota/pembayaran "
                f"berkenaan dengan item {it.item_name}, meminta selisih harga dikembalikan kepada "
                f"kas/pihak pemasok, serta menyempurnakan Prosedur Operasional Baku (SOP) pembelian belanja "
                f"agar setiap harga pembelian tidak melebihi harga acuan pasar yang berlaku."
            ),
        ]
        blocks.append((f"b. Temuan Pemeriksaan {no} — {it.item_name}", txt))

    if not signif:
        total = sum((i.qty or 0) * (i.market_price or 0) for i in items)
        nota_ref_txt = ""
        if getattr(report, "nota_date", None):
            nota_ref_txt = f" atas nota/RAB tanggal {tanggal_indonesia(report.nota_date)}"
        blocks.append((
            "a. Hasil Pemeriksaan Item — Sesuai",
            [
                f"Hasil pemeriksaan terhadap <b>{len(items)} item</b> belanja pada <b>{sppg_name or 'unit SPPG'}</b>{nota_ref_txt} "
                f"menunjukkan bahwa seluruh harga pembelian yang tercantum pada nota telah memenuhi harga "
                f"acuan pasar yang berlaku, sehingga <b>tidak ditemukan selisih harga</b> yang menimbulkan "
                f"potensi kerugian. Total nilai belanja yang dianalisis adalah sebesar {rupiah(total)} "
                f"({terbilang(total)})."
            ],
        ))
    return blocks


def _ikhtisar(report, items, sppg_name, config):
    total_belanja = sum((i.qty or 0) * (i.price_per_unit or 0) for i in items)
    loss = report.total_potential_loss or 0.0
    prot_id = report.sppg_id
    lines = [
        f"Berdasarkan pemeriksaan atas <b>{report.total_items or len(items)} item</b> belanja "
        f"<b>{sppg_name or 'unit SPPG'}</b> pada tanggal {tanggal_indonesia(report.report_date or date.today())}, "
        f"dengan total nilai belanja {rupiah(total_belanja)} ({terbilang(total_belanja)}), "
        f"hasil pemeriksaan menyimpulkan <b>{_status_label(report.status)}</b>.",
    ]
    if loss > 0:
        lines.append(
            f"Hasil pemeriksaan menemukan <b>potensi kerugian / pemborosan anggaran sebesar "
            f"{rupiah(loss)} ({terbilang(loss)})</b> yang bersumber dari {len([i for i in items if (i.potential_loss or 0) > 0])} item "
            f"belanja yang harganya melampaui harga acuan pasar. Atas hal tersebut telah diberikan rekomendasi "
            f"tindak lanjut sebagaimana diuraikan pada bagian hasil pemeriksaan."
        )
    else:
        lines.append(
            "Hasil pemeriksaan tidak menemukan selisih harga yang melampaui harga acuan pasar; seluruh "
            "belanja dinyatakan wajar dan sesuai dengan komoditas serta harga yang berlaku di pasar."
        )
    return lines


def _pendahuluan(report, sppg_name, config):
    return [
        f"Berdasarkan ketentuan pelaksanaan pengawasan internal pemerintahan dan dalam rangka tertib "
        f"pengelolaan keuangan program MBG (Makan Bergizi Gratis) melalui Satuan Pangan Produksi Gizi (SPPG), "
        f"telah dilakukan pemeriksaan atas belanja operasional pada <b>{sppg_name or 'unit SPPG'}</b>.",
        f"Tujuan pemeriksaan adalah untuk menilai kewajaran dan kepatuhan harga pembelian belanja terhadap "
        f"harga acuan pasar komoditas yang berlaku, serta mengukur potensi kerugian/pemborosan anggaran atas "
        f"selisih harga yang ditemukan.",
        f"Ruang lingkup pemeriksaan meliputi seluruh item belanja pada laporan nomor dokumen "
        f"<b>{report.doc_url or '-'}</b>, pada periode berlakunya laporan tersebut.",
        "Metodologi pemeriksaan dilakukan secara reviu dan pengujian atas dokumen belanja (nota/RAB) dengan "
        "teknik pembacaan dokumen digital (OCR), penelusuran pencatatan, serta pembandingan harga belanja "
        "dengan harga acuan pasar komoditas yang bersumber dari survai harga pasar dan data rujukan resmi "
        "(SP2KP/Disperindag NTB). Analisis dilakukan secara kuantitatif atas setiap selisih harga per item.",
    ]


def _simpulan(report, items, sppg_name, config):
    signif = [i for i in items if (i.potential_loss or 0) > 0]
    loss = report.total_potential_loss or 0.0
    if _status_label(report.status) == "DANGER (Berisiko Tinggi)":
        s = (
            f"Berdasarkan hasil pemeriksaan, <b>ditemukan penyimpangan yang signifikan</b> dalam pembelian "
            f"belanja pada {sppg_name or 'unit SPPG'}. Sebanyak {len(signif)} dari {len(items)} item belanja "
            f"memiliki selisih harga di atas acuan pasar dengan potensi kerugian sebesar "
            f"{rupiah(loss)} ({terbilang(loss)}). Hal ini menandakan pengelolaan belanja belum sepenuhnya "
            f"mematuhi harga acuan pasar dan memerlukan tindak lanjut segera."
        )
    elif _status_label(report.status) == "WARNING (Perlu Kewaspadaan)":
        s = (
            f"Hasil pemeriksaan menunjukkan <b>adanya temuan yang perlu diwaspadai</b> pada "
            f"{len(signif)} item belanja {sppg_name or 'unit SPPG'} dengan potensi kerugian "
            f"{rupiah(loss)} ({terbilang(loss)}). Sebagian besar belanja telah mengikuti harga acuan pasar, "
            f"namun tetap diperlukan koreksi atas selisih serta penguatan pengendalian intern."
        )
    else:
        s = (
            f"Hasil pemeriksaan terhadap belanja pada {sppg_name or 'unit SPPG'} disimpulkan <b>sesuai dan "
            f"wajar</b>. Seluruh harga pembelian telah memenuhi harga acuan pasar dan tidak ditemukan potensi "
            f"kerugian/pemborosan anggaran."
        )
    return [s]


def _rekomendasi_umum(report, items, sppg_name, config):
    signif = [i for i in items if (i.potential_loss or 0) > 0]
    recs = [f"Kepada pengelola {sppg_name or 'unit SPPG'} agar:",
            f"1) Melakukan koreksi atas selisih harga pada {len(signif)} item belanja temuan dan meminta "
            f"pengembalian selisih dimaksud kepada pihak pemasok/kas;",
            f"2) Menyempurnakan SOP pembelian agar setiap harga pembelian belanja dibandingkan terlebih "
            f"dahulu dengan harga acuan pasar komoditas yang berlaku;",
            f"3) Mendokumentasikan secara tertib nota dan bukti pembayaran setiap belanja sebagai bahan "
            f"pemeriksaan berikutnya;",
            f"4) Menyusun rencana pembelian (RAB) berdasarkan komposisi kebutuhan dan harga acuan pasar "
            f"sebagai dasar pengendalian anggaran.",
            "Kepada pemeriksa agar melakukan pemantauan tindak lanjut atas rekomendasi di atas secara berkala."]
    return recs


# ---------------------------------------------------------------------------
# PDF builder
# ---------------------------------------------------------------------------
def build_audit_report_pdf(report, items, sppg_name, config, penyusun=None, ttd_image_bytes=None) -> bytes:
    styles = _styles()
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Laporan Hasil Pemeriksaan",
        author=(config.get("instansi") or "SPPG"),
    )

    story = []

    # --- Kop surat ---
    instansi = config.get("instansi") or "UNIT SPPG"
    alamat = config.get("instansi_alamat") or "Kecamatan Sikur, Kabupaten Lombok Timur, Nusa Tenggara Barat"
    kota = config.get("instansi_kota") or "Lombok Timur"
    story.append(Paragraph(instansi.upper(), styles["kop"]))
    if alamat:
        story.append(Paragraph(alamat, ParagraphStyle("a", parent=styles["sub"], fontSize=10, leading=13)))
    story.append(HRFlowable(width="100%", thickness=1.1, color=colors.black, spaceBefore=4, spaceAfter=1))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceBefore=0, spaceAfter=6))

    story.append(Paragraph("LAPORAN HASIL PEMERIKSAAN BELANJA", styles["title"]))
    story.append(Paragraph("(LHA)", styles["sub"]))
    story.append(Spacer(1, 8))

    nomor = report.report_number or "-"
    tgl = tanggal_indonesia(report.report_date or date.today())
    meta_tbl = Table(
        [[Paragraph("Nomor", styles["meta"]), Paragraph(":", styles["meta"]), Paragraph(nomor, styles["meta"])],
         [Paragraph("Tanggal", styles["meta"]), Paragraph(":", styles["meta"]), Paragraph(tgl, styles["meta"])],
         [Paragraph("Perihal", styles["meta"]), Paragraph(":", styles["meta"]),
          Paragraph(f"Hasil Pemeriksaan Belanja {sppg_name or 'Unit SPPG'}", styles["meta"])]],
        colWidths=[26 * mm, 5 * mm, None],
    )
    meta_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(meta_tbl)
    story.append(Spacer(1, 8))

    # --- I. Pendahuluan ---
    pend = _pendahuluan(report, sppg_name, config)
    story.append(Paragraph("I. PENDAHULUAN", styles["h2"]))
    story.append(Paragraph("1.1 Dasar Pemeriksaan", styles["h3"]))
    story.append(Paragraph(pend[0], styles["base"]))
    story.append(Paragraph("1.2 Tujuan Pemeriksaan", styles["h3"]))
    story.append(Paragraph(pend[1], styles["base"]))
    story.append(Paragraph("1.3 Ruang Lingkup", styles["h3"]))
    story.append(Paragraph(pend[2], styles["base"]))
    story.append(Paragraph("1.4 Metodologi", styles["h3"]))
    story.append(Paragraph(pend[3], styles["base"]))

    # --- II. Ikhtisar Hasil Pemeriksaan ---
    story.append(Paragraph("II. IKHTISAR HASIL PEMERIKSAAN", styles["h2"]))
    for p in _ikhtisar(report, items, sppg_name, config):
        story.append(Paragraph(p, styles["base"]))

    # --- III. Hasil Pemeriksaan (rincian) ---
    story.append(Paragraph("III. HASIL PEMERIKSAAN", styles["h2"]))
    story.append(Paragraph("3.1 Rincian Item Belanja", styles["h3"]))
    header = ["No", "Uraian Item", "Satuan", "Qty", "Harga Nota (Rp)", "Harga Acuan (Rp)", "Selisih/Unit (Rp)", "% Markup", "Potensi Kerugian (Rp)"]
    data = [[Paragraph(h, styles["th"]) for h in header]]
    for idx, it in enumerate(items, start=1):
        diff = (it.price_per_unit or 0) - (it.market_price or 0)
        pct = (diff / it.market_price * 100) if it.market_price else 0.0
        unit_txt = (it.unit or "kg").strip() or "satuan"
        acuan_txt = rupiah(it.market_price)
        if getattr(it, "unit_converted", False):
            acuan_txt += f" *" if it.market_price else ""
        row = [
            Paragraph(str(idx), styles["cellc"]),
            Paragraph(str(it.item_name or "-"), styles["cell"]),
            Paragraph(unit_txt, styles["cellc"]),
            Paragraph(f"{it.qty:,.0f}", styles["cellr"]),
            Paragraph(rupiah(it.price_per_unit), styles["cellr"]),
            Paragraph(acuan_txt, styles["cellr"]),
            Paragraph(rupiah(diff), styles["cellr"]),
            Paragraph(f"{pct:.2f}%" if it.market_price else "N/A", styles["cellc"]),
            Paragraph(rupiah(it.potential_loss), styles["cellr"]),
        ]
        data.append(row)

    tbl = Table(data, colWidths=[9 * mm, 42 * mm, 12 * mm, 13 * mm, 25 * mm, 25 * mm, 25 * mm, 15 * mm, 26 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
        ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.92, 0.92, 0.92)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    for i, it in enumerate(items, start=1):
        if (it.potential_loss or 0) > 0 and i % 2 == 0:
            tbl.setStyle(TableStyle([("BACKGROUND", (0, i), (-1, i), colors.Color(1, 0.95, 0.9))]))
    story.append(tbl)
    story.append(Spacer(1, 3))
    if any(getattr(i, "unit_converted", False) for i in items):
        story.append(Paragraph(
            "Catatan: *) Harga acuan telah disetarakan dari satuan asal survai pasar ke satuan pada nota "
            "berdasarkan faktor konversi yang ditetapkan (asumsi konversi untuk keperluan analisis).",
            ParagraphStyle("legenda", parent=styles["base"], fontSize=8, leading=10, textColor=colors.grey)))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Jumlah item: <b>{len(items)}</b>; Total potensi kerugian/pemborosan: "
        f"<b>{rupiah(report.total_potential_loss or 0)}</b>.", styles["base"]))

    # --- IV. Temuan & Analisis ---
    story.append(Paragraph("IV. TEMUAN DAN ANALISIS", styles["h2"]))
    signif = [i for i in items if (i.potential_loss or 0) > 0]
    if signif:
        story.append(Paragraph(
            "Berdasarkan hasil pembandingan harga nota terhadap harga acuan pasar komoditas, ditemukan "
            f"selisih harga pada <b>{len(signif)} item</b> belanja dengan perincian sebagai berikut:",
            styles["base"]))
    for heading, paras in _temuan_narasi(report, items, sppg_name, config):
        story.append(KeepTogether([Paragraph(heading, styles["h3"])] + [Paragraph(p, styles["base"]) for p in paras]))
        story.append(Spacer(1, 4))

    # --- V. Simpulan ---
    story.append(Paragraph("V. SIMPULAN", styles["h2"]))
    for p in _simpulan(report, items, sppg_name, config):
        story.append(Paragraph(p, styles["base"]))

    # --- VI. Rekomendasi ---
    story.append(Paragraph("VI. REKOMENDASI", styles["h2"]))
    for p in _rekomendasi_umum(report, items, sppg_name, config):
        story.append(Paragraph(p, styles["base"]))

    # --- VII. Penutup ---
    story.append(Paragraph("VII. PENUTUP", styles["h2"]))
    story.append(Paragraph(
        "Demikian laporan hasil pemeriksaan ini disampaikan untuk diketahui dan ditindaklanjuti sebagaimana "
        "mestinya. Atas perhatian dan kerja sama semua pihak, diucapkan terima kasih.",
        styles["base"]))

    # --- Tanda tangan ---
    story.append(Spacer(1, 20))
    py = []
    py.append(Paragraph("Mengetahui,", styles["base"]))
    py.append(Spacer(1, 30))
    if ttd_image_bytes and len(ttd_image_bytes) > 100:
        try:
            py.append(Image(BytesIO(ttd_image_bytes), width=40 * mm, height=20 * mm))
        except Exception:
            py.append(Spacer(1, 12))
    py.append(Paragraph(config.get("penanggung_jawab") or "&nbsp;", styles["base"]))
    py.append(Paragraph(config.get("jabatan_pj") or "&nbsp;", styles["base"]))
    if config.get("nip_pj"):
        py.append(Paragraph(f"NIP. {config['nip_pj']}", styles["base"]))
    if penyusun:
        py.append(Spacer(1, 8))
        py.append(Paragraph(f"Pemeriksa: {penyusun}", styles["meta"]))
    sign_table = Table(
        [[Paragraph("", styles["base"]), Table([[p] for p in py], colWidths=[70 * mm])]],
        colWidths=[80 * mm, 85 * mm],
    )
    story.append(sign_table)

    doc.build(story)
    return buf.getvalue()