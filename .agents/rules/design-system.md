# GIS-SPPG Design System & UI Consistency Rules

Aturan ini wajib dipatuhi oleh semua AI Agent saat mengedit, membuat, atau memperbarui komponen antarmuka aplikasi GIS-SPPG.

## 1. Prinsip Utama Desain
- **Gaya**: Clean, Modern SaaS (gaya Linear / Supabase / Notion).
- **Nuansa**: Bersih, fungsional, profesional, kontras jelas, tidak berlebihan.

## 2. Standar Border Radius & Card
- Gunakan radius standar: `rounded-xl` (12px), `rounded-lg` (8px), atau `rounded-md` (6px).
- **DILARANG** menggunakan sudut ekstrim seperti `rounded-[2.5rem]`, `rounded-[3rem]`, atau `rounded-3xl` yang berlebihan.
- Komponen card: selalu gunakan class `.card` (`bg-white rounded-xl border border-slate-200 shadow-sm`).

## 3. Komponen Desain Terpusat (`index.css`)
Selalu prioritaskan class reusable daripada menulis utilitas ad-hoc:
- **Header Halaman**: `<h1 className="page-header">Judul</h1>` dan `<p className="page-subtitle">Subjudul</p>`
- **Tombol**:
  - Primary: `.btn-primary` (`bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold`)
  - Secondary: `.btn-secondary` (`bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2 text-xs font-semibold`)
  - Ghost: `.btn-ghost`
  - Danger: `.btn-danger`
- **Form Input**:
  - Teks / Select / Textarea: gunakan `.input` (`bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900`)
- **Badge**:
  - `.badge-aktif`, `.badge-nonaktif`, `.badge-pending`, `.badge-verified`, `.badge-rejected`
- **Tabel**:
  - Header: `.table-header`
  - Baris: `.table-row`

## 4. Modal & Drawer
- Overlay: `bg-slate-950/80 backdrop-blur-sm`
- Container: `bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden`
- Header: `px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between`
- Footer: `px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2`

## 5. Navigasi & Hak Akses (RBAC)
- Pengaturan menu sidebar dan hak akses per-role diatur terpusat di `frontend/src/config/rolePermissions.js`.
- Jangan melakukan hardcode menu di dalam komponen individual.
