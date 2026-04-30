🌐 GIS-SPPG Application
Sistem Informasi Pemetaan dan Alokasi Kelompok Penerima SPPG

Aplikasi berbasis web untuk mengelola dan memetakan unit SPPG serta alokasi kelompok penerima secara otomatis menggunakan teknologi PostGIS.

🚀 Fitur Utama
Modern Mapping: Visualisasi titik SPPG dan Kelompok di peta interaktif.

Auto-Allocation: Algoritma otomatis untuk menentukan SPPG terdekat bagi kelompok penerima.

Role-Based Access: Sistem autentikasi untuk Admin, Kepala SPPG, dan Koordinator Kecamatan.

Mobile Friendly: Antarmuka responsif (Ocean Blue Palette) yang nyaman digunakan di lapangan via smartphone.

🛠 Tech Stack
Frontend: React.js, Tailwind CSS, Leaflet.js

Backend: FastAPI (Python)

Database: PostgreSQL + PostGIS (Hosted on Supabase)

Deployment: Vercel (Frontend) & Render (Backend)

📋 Struktur Proyek
Plaintext
/backend          # FastAPI API & Business Logic
/frontend         # React App & UI/UX
.gitignore        # Ignored files (env, node_modules)
README.md         # Documentation
⚙️ Cara Menjalankan Lokal
Setup Database: Jalankan skrip di init_supabase.sql pada SQL Editor Supabase.

Backend:

Bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
Frontend:

Bash
cd frontend
npm install
npm run dev
Langkah Selanjutnya: