import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, 
  Phone, 
  Globe, 
  Heart, 
  Shield, 
  Users, 
  ArrowRight, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  Building2,
  Apple,
  DollarSign,
  Activity,
  CheckCircle2,
  UserCheck,
  Layers,
  MapPin,
  TrendingUp,
  Award,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SikurSilhouetteMap from '../components/SikurSilhouetteMap';

const LandingPage = ({ previewData = null }) => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState('sppg_head');
  const [selectedVillage, setSelectedVillage] = useState(null);

  useEffect(() => {
    if (previewData) {
      const timer = setTimeout(() => {
        setConfig(previewData);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchConfig = async () => {
      const { data, error } = await supabase.from('landing_config').select('key, value');
      if (error) {
        console.error('Error fetching landing config:', error);
      } else {
        const configMap = (data || []).reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
        setConfig(configMap);
      }
      setLoading(false);
    };

    fetchConfig();
  }, [previewData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-blue-500 font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Memuat Portal GIS-SPPG...</span>
        </div>
      </div>
    );
  }

  const missions = [
    { id: 1, text: config.mission_1 || 'Pemerataan distribusi bantuan gizi tepat sasaran berbasis spasial geografis.', icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-100' },
    { id: 2, text: config.mission_2 || 'Pengawasan standar nutrisi MBG & kebersihan hygiene K3 unit SPPG.', icon: Shield, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { id: 3, text: config.mission_3 || 'Transparansi anggaran belanja & survei harga acuan pasar komoditas.', icon: DollarSign, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  ];

  const targets = [
    { key: 'sasaran_students', label: 'Siswa Sekolah (PAUD, SD, SMP, SMA)', desc: 'Pemenuhan gizi seimbang untuk kecerdasan & tumbuh tumbuh anak bangsa.', icon: Apple },
    { key: 'sasaran_children', label: 'Anak Balita (Usia 0-5 Tahun)', desc: 'Pencegahan stunting dan pemantauan gizi mikro di Posyandu.', icon: Heart },
    { key: 'sasaran_mothers', label: 'Ibu Hamil & Menyusui', desc: 'Dukungan gizi essensial untuk kesehatan ibu dan kecukupan ASI janin.', icon: Shield },
  ];

  const rolesMatrix = [
    {
      id: 'admin',
      name: 'System Administrator',
      badge: '🔴 Akses Global',
      desc: 'Superuser dengan wewenang mengelola seluruh SPPG, pengguna, audit log, dan pengaturan sistem.',
      features: ['Manajemen Pengguna & Peran', 'Editor Landing Page', 'Audit Log Aktivitas', 'Pengaturan Global DB']
    },
    {
      id: 'kecamatan_coordinator',
      name: 'Koordinator Kecamatan',
      badge: '🔵 Akses Kecamatan',
      desc: 'Mengkoordinasi seluruh unit SPPG di Kecamatan Sikur, alokasi otomatis, survei pasar, & audit.',
      features: ['Alokasi Otomatis Nearest-SPPG', 'Peta Tematik Spasial GIS', 'Survei Pasar Bahan Baku', 'Smart Audit OCR Nota']
    },
    {
      id: 'sppg_head',
      name: 'Kepala Unit SPPG',
      badge: '🟢 Terikat Unit SPPG',
      desc: 'Mengelola operasional harian, alokasi kelompok penerima, dan evaluasi unit SPPG terikat.',
      features: ['Operasional SPPG Terikat', 'Kelompok Penerima Bantuan', 'Raport Kinerja Unit', 'Statistik Distribusi Harian']
    },
    {
      id: 'nutrition_inspector',
      name: 'Pengawas Gizi',
      badge: '🟣 Terikat Unit SPPG',
      desc: 'Memastikan kecukupan gizi menu MBG, checklist hygiene/K3, dan kesehatan sekolah/posyandu.',
      features: ['Penilaian Raport Gizi', 'Checklist K3 & Hygiene', 'Verifikasi Menu MBG', 'Pemantauan Sekolah/Posyandu']
    },
    {
      id: 'finance_inspector',
      name: 'Pengawas Keuangan',
      badge: '🟡 Terikat Unit SPPG',
      desc: 'Mengaudit RAB belanja, nota OCR otomatis, dan survei harga komoditas acuan pasar.',
      features: ['Audit Center & OCR Nota', 'Laporan Potensi Kerugian', 'Survey Harga Bahan Baku', 'Riwayat Perubahan Harga']
    }
  ];

  const desaSikurList = [
    'Darmasari',
    'Gelora',
    'Jeruk Manis',
    'Kembang Kuning',
    'Kota Raja',
    'Loyok',
    'Montong Baan',
    'Montong Baan Selatan',
    'Semaya',
    'Sikur',
    'Sikur Barat',
    'Sikur Selatan',
    'Tete Batu',
    'Tetebatu Selatan'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white overflow-x-hidden font-['Plus_Jakarta_Sans']">
      
      {/* FLOATING CLEAN NAVIGATION BAR */}
      <nav className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm px-6 h-16 sm:h-18 flex items-center justify-between transition-all">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm text-white">
              <MapIcon size={18} />
            </div>
            <div className="flex flex-col">
               <span className="text-base font-bold tracking-tight leading-none text-slate-900">GIS-SPPG</span>
               <span className="text-[10px] font-medium text-slate-500 mt-0.5">Kecamatan Sikur</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#fitur" className="text-xs font-semibold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors">Fitur Utama</a>
            <a href="#roles" className="text-xs font-semibold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors">5 Roles RBAC</a>
            <a href="#misi" className="text-xs font-semibold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors">Misi & Target</a>
            <a href="#wilayah" className="text-xs font-semibold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors">Peta Wilayah</a>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center gap-2"
            >
              <UserCheck size={15} /> Masuk Portal
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden max-w-6xl mx-auto mt-2 bg-white rounded-xl border border-slate-200 shadow-xl p-5 space-y-4"
            >
              <div className="flex flex-col gap-3">
                <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-700">Fitur Utama</a>
                <a href="#roles" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-700">5 Roles RBAC</a>
                <a href="#misi" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-700">Misi & Target</a>
                <a href="#wilayah" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-700">Peta Wilayah</a>
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 bg-blue-600 text-white text-center rounded-lg font-semibold text-xs">
                  Masuk Portal Staf
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 border-b border-slate-200/60">
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-800">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span>{config.vision_text || 'Sistem Informasi Pemetaan Gizi — Kecamatan Sikur'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-slate-900 max-w-4xl mx-auto">
              {config.hero_title || 'Digitalisasi Pemetaan & Alokasi Gizi SPPG'}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              {config.hero_subtitle || 'Optimasi alokasi kelompok penerima manfaat, evaluasi gizi MBG, audit nota belanja OCR, dan survei komoditas pasar secara akurat berbasis PostGIS.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                Mulai Akses Dashboard <ArrowRight size={16} />
              </Link>
              <a 
                href="#roles" 
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                Lihat 5 Hak Akses
              </a>
            </div>
          </motion.div>

          {/* Clean Mock Dashboard Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="pt-6 max-w-4xl mx-auto"
          >
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden text-left text-white">
              {/* Header Bar */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono text-slate-400">gis-sppg.sikur.go.id/dashboard/mapping</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <Activity size={12} className="animate-pulse" /> 14 Desa Terhubung
                </div>
              </div>

              {/* Showcase Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between min-h-[200px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">PetaGIS Tematik</span>
                      <h4 className="text-base font-bold text-white">Unit SPPG & Posyandu Sikur</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-[10px] font-mono">EPSG:4326</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3">
                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Total SPPG</p>
                      <p className="text-lg font-bold text-white">14 Unit</p>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Sekolah/Posyandu</p>
                      <p className="text-lg font-bold text-emerald-400">85 Kelompok</p>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Metode Alokasi</p>
                      <p className="text-xs font-semibold text-amber-300 mt-1">Nearest Distance</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2.5 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">Modul Smart Audit</span>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">OCR Nota Belanja</p>
                        <p className="text-[10px] text-slate-400">Gemini Vision AI</p>
                      </div>
                      <span className="text-xs font-medium text-emerald-400">Aktif</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">Survey Komoditas</p>
                        <p className="text-[10px] text-slate-400">Harga Acuan Pasar</p>
                      </div>
                      <span className="text-xs font-medium text-blue-400">Updated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS OVERVIEW SECTION */}
      <section id="fitur" className="py-12 px-4 sm:px-6 bg-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { val: '14 Unit', label: 'SPPG Terdaftar', sub: 'Kecamatan Sikur', icon: Building2, color: 'text-blue-600 bg-blue-50' },
              { val: '85+', label: 'Sekolah & Posyandu', sub: 'Kelompok Penerima', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
              { val: '99.9%', label: 'Akurasi Jarak GIS', sub: 'PostGIS Geography', icon: MapPin, color: 'text-indigo-600 bg-indigo-50' },
              { val: '5 Level', label: 'Hak Akses RBAC', sub: 'Terikat Unit SPPG', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' }
            ].map((stat, idx) => (
              <div key={idx} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 hover:bg-white hover:shadow-sm transition-all">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color} mb-2`}>
                  <stat.icon size={18} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.val}</h3>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{stat.label}</p>
                  <p className="text-[11px] text-slate-400">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 ROLES MATRIX SECTION */}
      <section id="roles" className="py-20 px-4 sm:px-6 bg-slate-100/70 border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              Manajemen Hak Akses Terstruktur
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              5 Peran (Roles) & Batasan Akses SPPG
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Sistem keamanan terikat di masing-masing unit SPPG untuk menjamin integritas data operasional, gizi, dan audit keuangan.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {rolesMatrix.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRoleTab(r.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeRoleTab === r.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Active Role Content Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
            {rolesMatrix.filter(r => r.id === activeRoleTab).map((role) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-semibold text-blue-600">{role.badge}</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">{role.name}</h3>
                  </div>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-all w-fit"
                  >
                    Masuk Akun Role Ini
                  </Link>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed">
                  {role.desc}
                </p>

                <div className="space-y-2.5 pt-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fitur & Wewenang:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {role.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-medium text-slate-800">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* PROGRAM MBG STRATEGIC SECTION */}
      <section id="misi" className="py-20 px-4 sm:px-6 bg-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-xl space-y-4">
              <span className="px-2.5 py-1 bg-white/10 border border-white/15 rounded-md text-xs font-semibold text-blue-200">
                Inisiatif Strategis Nasional
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                {config.mbg_title || 'Makan Bergizi Gratis (MBG)'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {config.mbg_desc || 'Program unggulan pemenuhan gizi anak sekolah, balita, dan ibu hamil secara terstruktur di Kecamatan Sikur untuk melahirkan generasi emas Indonesia.'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="px-3 py-1.5 bg-white/10 rounded-md text-xs font-medium">
                  🥗 Standar Nutrisi MBG
                </div>
                <div className="px-3 py-1.5 bg-white/10 rounded-md text-xs font-medium">
                  📍 Alokasi Jarak Terdekat
                </div>
                <div className="px-3 py-1.5 bg-white/10 rounded-md text-xs font-medium">
                  🔍 Transparansi & Audit
                </div>
              </div>
            </div>
          </div>

          {/* Missions Grid */}
          <div className="space-y-6">
            <div className="text-center space-y-1 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Misi Utama Badan Gizi</h2>
              <p className="text-xs text-slate-500">Tiga pilar layanan utama dalam pemetaan dan alokasi gizi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {missions.map((misi, i) => (
                <div
                  key={i}
                  className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${misi.color}`}>
                    <misi.icon size={20} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {misi.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* TARGET BENEFICIARIES SECTION */}
      <section className="py-16 px-4 sm:px-6 bg-blue-600 rounded-2xl mx-3 sm:mx-6 my-8 text-white">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-1 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Prioritas Layanan Gizi</h2>
            <p className="text-blue-100 text-xs">Sasaran utama distribusi bantuan gizi di Kecamatan Sikur.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {targets.map((target, idx) => (
              <div key={idx} className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15 space-y-3">
                <div className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                  0{idx + 1}
                </div>
                <h3 className="text-base font-bold">{config[target.key] || target.label}</h3>
                <p className="text-xs text-blue-100 leading-relaxed">{target.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COVERAGE MAP VILLAGES SECTION */}
      <section id="wilayah" className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="text-center space-y-1 max-w-xl mx-auto">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
              Cakupan Batas Wilayah Spasial GIS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Peta Siluet 14 Desa Kecamatan Sikur
            </h2>
            <p className="text-xs text-slate-500">
              Batas wilayah desa terintegrasi dari data GeoJSON PostGIS SRID 4326.
            </p>
          </div>

          {/* Grid Layout: Map Silhouette + Village Selector Chips */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left/Top: Vector Map Silhouette */}
            <div className="lg:col-span-7">
              <SikurSilhouetteMap 
                selectedVillage={selectedVillage} 
                onSelectVillage={(vName) => setSelectedVillage(prev => prev === vName ? null : vName)} 
              />
            </div>

            {/* Right/Bottom: 14 Village Chips Selector */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">14 Desa Resmi</h4>
                {selectedVillage && (
                  <button 
                    onClick={() => setSelectedVillage(null)} 
                    className="text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    Reset Pilihan
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {desaSikurList.map((desa, idx) => {
                  const isSelected = selectedVillage === desa;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVillage(prev => prev === desa ? null : desa)}
                      className={`p-2.5 rounded-lg text-left border text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin size={13} className={isSelected ? 'text-white' : 'text-blue-600'} />
                        <span className="truncate">{desa}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-6 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <MapIcon size={16} />
                </div>
                <span className="text-lg font-bold tracking-tight">GIS-SPPG</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {config.footer_text || 'Sistem Informasi Pemetaan dan Alokasi Kelompok Penerima Satuan Pangan Produksi Gizi (SPPG) Kecamatan Sikur, Lombok Timur.'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kontak Resmi</h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="flex items-center gap-2"><Phone size={13} className="text-blue-400" /> {config.whatsapp || '+62 812-3456-7890'}</p>
                <p className="flex items-center gap-2"><Globe size={13} className="text-blue-400" /> {config.email || 'info@sppg-sikur.go.id'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Navigasi</h4>
              <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                <Link to="/login" className="hover:text-blue-400 transition-colors">Portal Masuk Staf</Link>
                <Link to="/login" className="hover:text-blue-400 transition-colors">Pendaftaran Akun SPPG</Link>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
            <p>&copy; 2026 GIS-SPPG Kecamatan Sikur — Badan Gizi Nasional</p>
            <p>PostGIS & GeoAlchemy2 Powered</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;

