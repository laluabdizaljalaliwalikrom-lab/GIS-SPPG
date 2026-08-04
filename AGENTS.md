# GIS-SPPG — Panduan untuk AI Agent

## Ringkasan Proyek

Sistem Informasi Pemetaan dan Alokasi Kelompok Penerima SPPG (Satuan Pangan Produksi Gizi). Aplikasi web untuk mengelola unit SPPG dan alokasi kelompok penerima (sekolah/posyandu) secara otomatis berbasis jarak geografis.

**Domain:** Kecamatan Sikur, Lombok Timur, NTB.

---

## Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 3, Leaflet + react-leaflet, TanStack Query 5, React Router 7, Axios, react-hook-form + Zod, framer-motion, lucide-react, react-hot-toast |
| Backend | FastAPI, SQLAlchemy 2.0 + GeoAlchemy2, Pydantic 2, python-jose (JWT), google-generativeai (Gemini Vision), Pandas + openpyxl |
| Database | PostgreSQL 15 + PostGIS (Supabase) |
| Auth | Supabase Auth (email/password, JWT) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Struktur Proyek

```
GIS-SPPG/
├── AGENTS.md
├── README.md
├── LOCAL_SETUP.md
├── docker-compose.yml
├── init_supabase.sql
├── create_audit_tables.sql
├── create_landing_config.sql
├── .env
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app + seluruh route
│   │   ├── models.py         # 10 ORM models
│   │   ├── schemas.py        # 20+ Pydantic schemas
│   │   ├── crud.py           # Semua business logic & query DB
│   │   ├── database.py       # Engine SQLAlchemy + session
│   │   ├── dependencies.py   # Auth JWT + role guards
│   │   └── ocr.py            # OCR dokumen (Gemini Vision)
│   ├── static/uploads/       # Upload lokal (fallback)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx          # Entry point (QueryClientProvider)
│   │   ├── App.jsx           # Router & route definitions
│   │   ├── api.js            # Axios instance + interceptor
│   │   ├── supabaseClient.js # Supabase client
│   │   ├── index.css         # Tailwind + design system
│   │   ├── assets/
│   │   │   └── sikur.json    # GeoJSON batas desa Kec. Sikur
│   │   ├── hooks/
│   │   │   ├── useSPPG.js
│   │   │   ├── useKelompok.js
│   │   │   └── useLandingConfig.js
│   │   ├── components/
│   │   │   ├── MapComponent.jsx
│   │   │   ├── EntityDetailDrawer.jsx
│   │   │   ├── EntityDetailForm.jsx
│   │   │   ├── SPPGUnitForm.jsx
│   │   │   ├── KelompokForm.jsx
│   │   │   ├── FormModal.jsx
│   │   │   ├── ExcelImportButton.jsx
│   │   │   ├── RaportPointManager.jsx
│   │   │   └── SPPGChecklist.jsx
│   │   └── pages/
│   │       ├── LandingPage.jsx
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── MapView.jsx
│   │       ├── StatsOverview.jsx
│   │       ├── SPPGManagement.jsx
│   │       ├── KelompokManagement.jsx
│   │       ├── RaportPage.jsx
│   │       ├── AuditCenter.jsx
│   │       ├── AuditLogs.jsx
│   │       ├── LandingPageEditor.jsx
│   │       ├── Settings.jsx
│   │       └── UserManagement.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
```

---

## Database Schema (9 Tabel)

| Tabel | PK | Catatan |
|-------|----|---------|
| `sppg_units` | `id SERIAL` | Kolom `geom GEOGRAPHY(POINT,4326)`, 10 kolom score raport |
| `kelompok_penerima` | `id SERIAL` | `assigned_sppg_id` FK ke `sppg_units`, `status: pending_verification/verified/rejected` |
| `kelompok_detail` | `id SERIAL` | `kelompok_id UNIQUE` FK ke `kelompok_penerima` (one-to-one, cascade delete) |
| `profiles` | `id UUID` | `role: admin/sppg_head/kecamatan_coordinator`, auto-create via trigger `handle_new_user()` |
| `audit_logs` | `id SERIAL` | `action, target_table, target_id, details` |
| `market_prices` | `id SERIAL` | `item_name UNIQUE, reference_price, unit, region_id, shop_name` |
| `audit_reports` | `id SERIAL` | `doc_url, total_items, total_potential_loss, status: NORMAL/WARNING/DANGER` |
| `audit_items` | `id SERIAL` | `audit_report_id` FK ke `audit_reports` (cascade delete) |
| `landing_config` | `id SERIAL` | `section_name, key UNIQUE, value` — konten landing page |

**Relasi kunci:**
- `kelompok_penerima.assigned_sppg_id` → `sppg_units.id` (ON DELETE SET NULL)
- `kelompok_detail.kelompok_id` → `kelompok_penerima.id` (ON DELETE CASCADE)
- `profiles.sppg_id` → `sppg_units.id` (untuk role sppg_head)

---

## API Endpoints

Base URL: `http://localhost:8000/api`

### SPPG
| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| GET | `/sppg` | None | List SPPG (`?name=&skip=&limit=`) |
| POST | `/sppg` | coordinator | Create SPPG |
| POST | `/sppg/import` | coordinator | Import dari CSV/Excel |
| PUT | `/sppg/{id}` | coordinator | Update SPPG |
| DELETE | `/sppg/{id}` | admin | Delete SPPG |

### Kelompok
| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| GET | `/kelompok` | None | List kelompok (`?name=&status=&type=`) |
| POST | `/kelompok` | coordinator | Create kelompok (+ detail) |
| POST | `/kelompok/import` | coordinator | Import dari CSV/Excel |
| PUT | `/kelompok/{id}` | coordinator | Update |
| DELETE | `/kelompok/{id}` | admin | Delete |
| POST | `/kelompok/{id}/verify` | coordinator | Verify/reject |
| PATCH | `/kelompok/{id}/assign` | coordinator | Assign ke SPPG |

### Allocation
| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| POST | `/allocate` | None | Alokasi otomatis (nearest SPPG) |

### Users
| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| GET | `/users` | None | List profiles |
| POST | `/users` | None | Create user (Supabase Auth + profile) |
| PUT | `/users/{id}` | None | Update profile |
| DELETE | `/users/{id}` | None | Delete user |

### Raport & Checklist
| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| GET | `/raport-points` | None | List point checklist |
| POST | `/raport-points` | admin | Create point |
| DELETE | `/raport-points/{id}` | admin | Delete point |
| GET | `/sppg/{id}/checklist` | None | Get jawaban checklist SPPG |
| PUT | `/sppg/{id}/checklist` | coordinator | Update checklist |

### Audit (Smart Audit)
| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| POST | `/audit/upload` | coordinator | Upload dokumen → OCR → match harga → create report |
| GET | `/audit/reports` | coordinator | List reports |
| GET | `/audit/reports/{id}` | coordinator | Detail report + items |
| DELETE | `/audit/reports/{id}` | admin | Delete |
| GET | `/audit/market-prices` | coordinator | List harga acuan |
| POST | `/audit/market-prices` | admin | Create/update harga |
| DELETE | `/audit/market-prices/{id}` | admin | Delete harga |
| GET | `/audit/market-prices/history` | coordinator | Riwayat harga (`?item_name=`) |

### Dashboard
| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| GET | `/dashboard/stats` | None | Aggregated stats + top 5 SPPG by raport score |

---

## Authentication & RBAC

- **Auth Provider:** Supabase Auth (email/password)
- **Token:** JWT disimpan di `localStorage` dengan key `access_token`
- **Interceptor:** Axios (`api.js`) otomatis attach `Authorization: Bearer <token>`
- **Backend guard:** `dependencies.py` — decode JWT (tanpa verifikasi signature di dev), ambil `sub` sebagai `user_id`, fetch profile dari DB
- **Helper dependencies:**
  - `get_current_user()` — return Profile object
  - `admin_only()` — hanya role `admin`
  - `coordinator_only()` — role `admin` atau `kecamatan_coordinator`
- **Role definitions:** `admin`, `kecamatan_coordinator`, `sppg_head`

---

## Konvensi Koding

### Python (Backend)
- Tidak menggunakan `__init__.py` (mengandalkan implicit namespace package Python 3.3+)
- Semua route di satu file `main.py` (bukan router terpisah)
- Semua business logic di `crud.py`
- Model SQLAlchemy menggunakan `geoalchemy2.Geography('POINT', srid=4326)`
- JWT verification dimatikan di dev (`verify_signature: False`)
- Fungsi CRUD menerima `db: Session` dan parameter, mengembalikan dict/object

### JavaScript/React (Frontend)
- Gunakan `TanStack Query` untuk semua server state — query key prefix: `sppgs`, `kelompoks`, `raport-points`, `sppg-checklist`
- Custom hooks di `hooks/` — inkapsulasi query + mutation
- Api call via Axios instance (`api.js`) — base URL otomatis switch localhost/render
- Routing: React Router v7 — `ProtectedRoute` wrapper cek session Supabase
- Form: `react-hook-form` + `zodResolver`
- Styling: Tailwind utility classes diprioritaskan; gunakan kelas kustom dari `index.css` untuk pattern umum
- Map: `react-leaflet` dengan `MapContainer`, custom div icons, GeoJSON boundary, animated polylines
- Notifikasi: `react-hot-toast`

### Design System (CSS Classes)
- **Card:** `.card`, `.card-lg`, `.card-glass`, `.card-section`
- **Button:** `.btn-primary`, `.btn-ghost`, `.btn-danger`
- **Input:** `.input`, `.input-search`
- **Badge:** `.badge-aktif`, `.badge-nonaktif`, `.badge-pending`, `.badge-verified`, `.badge-rejected`
- **Table:** `.table-header`, `.table-row`
- **Other:** `.chip`, `.chip-active`, `.fab`, `.section-title`, `.page-header`, `.glass-panel`, `.skeleton`, `.no-scrollbar`

---

## Common Commands

```bash
# Frontend
cd frontend
npm install
npm run dev        # Dev server (localhost:5173)
npm run build      # Production build
npm run lint       # ESLint

# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # Dev server (localhost:8000)

# Docker
docker-compose up -d
```

---

## Environment Variables

### Root `.env`
```
SUPABASE_DB_URL=postgresql+psycopg2://user:pass@host:5432/db
SUPABASE_JWT_SECRET=<secret>
GEMINI_API_KEY=<key>       # Optional, untuk OCR
```

### Frontend `.env`
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

## Pola Umum & Catatan Penting

1. **CRUD Pattern:** Query → `GET /api/{entity}`, Create → `POST /api/{entity}`, Update → `PUT /api/{entity}/{id}`, Delete → `DELETE /api/{entity}/{id}`
2. **Alokasi Otomatis:** Greedy nearest-SPPG — setiap kelompok dicocokkan ke SPPG terdekat yang masih punya kapasitas
3. **Audit Flow:** Upload → OCR (Gemini/mock) → fuzzy match market_prices → hitung potential loss → klasifikasi NORMAL/WARNING/DANGER
4. **Raport Score:** 10 kategori (infrastruktur → administrasi), dihitung dari persentase checklist item terpenuhi
5. **GeoJSON Boundary:** `sikur.json` — 14 desa di Kecamatan Sikur, digunakan untuk layer batas wilayah di peta
6. **Upload file:** Disimpan ke Supabase Storage, fallback ke `backend/static/uploads/`
7. **Data template Excel:** Tersedia via `ExcelImportButton` — download template, upload file, batch insert
