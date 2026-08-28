/**
 * ─────────────────────────────────────────────
 *  KONFIGURASI HAK AKSES MENU PER ROLE
 * ─────────────────────────────────────────────
 *
 * Edit file ini untuk mengontrol menu yang bisa
 * diakses oleh setiap role — tanpa perlu menyentuh
 * logika Dashboard.
 *
 * DAFTAR PATH YANG TERSEDIA:
 *  /dashboard                 → Halaman utama / statistik
 *  /dashboard/mapping         → Peta GIS
 *  /dashboard/sppg            → Manajemen Unit SPPG
 *  /dashboard/raport          → Raport Kinerja
 *  /dashboard/kelompok        → Kelompok Penerima
 *  /dashboard/komoditas-harga → Harga Bahan Baku & Survey
 *  /dashboard/audit           → Audit Center (Smart Audit)
 *  /dashboard/settings        → Pengaturan Akun
 *  /dashboard/users           → Manajemen User        [admin only]
 *  /dashboard/logs            → Audit Trail Log       [admin only]
 *  /dashboard/landing-editor  → Editor Landing Page   [admin only]
 *
 * DAFTAR ROLE:
 *  admin                  → Super admin, akses penuh
 *  kecamatan_coordinator  → Koordinator kecamatan
 *  sppg_head              → Kepala unit SPPG
 *  finance_inspector      → Inspektur keuangan
 *
 * ─────────────────────────────────────────────
 */

export const ROLE_MENU_ACCESS = {
  admin: [
    '/dashboard',
    '/dashboard/mapping',
    '/dashboard/sppg',
    '/dashboard/raport',
    '/dashboard/kelompok',
    '/dashboard/komoditas-harga',
    '/dashboard/audit',
    '/dashboard/settings',
    '/dashboard/users',
    '/dashboard/logs',
    '/dashboard/landing-editor',
  ],

  kecamatan_coordinator: [
    '/dashboard',
    '/dashboard/mapping',
    '/dashboard/sppg',
    '/dashboard/raport',
    '/dashboard/kelompok',
    '/dashboard/komoditas-harga',
    '/dashboard/audit',
    '/dashboard/settings',
  ],

  sppg_head: [
    '/dashboard',
    '/dashboard/mapping',
    '/dashboard/sppg',
    '/dashboard/raport',
    '/dashboard/kelompok',
    '/dashboard/komoditas-harga',
    '/dashboard/audit',
    '/dashboard/settings',
  ],

  finance_inspector: [
    '/dashboard',
    '/dashboard/komoditas-harga',
    '/dashboard/audit',
    '/dashboard/settings',
  ],
};

/**
 * Role yang secara ketat di-redirect jika mencoba akses path tidak diizinkan.
 */
export const ENFORCE_REDIRECT_ROLES = ['finance_inspector'];

/**
 * Path khusus admin — tampil di seksi terpisah (bawah sidebar).
 */
export const ADMIN_ONLY_PATHS = [
  '/dashboard/users',
  '/dashboard/logs',
  '/dashboard/landing-editor',
];
