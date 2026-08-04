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
      
      {/* FLOATING GLASSMOGRAPHY NAVIGATION BAR */}
      <nav className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-lg shadow-slate-900/5 px-6 h-16 sm:h-20 flex items-center justify-between transition-all">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <MapIcon size={20} />
            </div>
            <div className="flex flex-col">
               <span className="text-lg font-black tracking-tight leading-none text-slate-900">GIS-SPPG</span>
               <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Kecamatan Sikur</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#fitur" className="text-xs font-bold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors">Fitur Utama</a>
            <a href="#roles" className="text-xs font-bold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors">5 Roles RBAC</a>
            <a href="#misi" className="text-xs font-bold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors">Misi & Target</a>
            <a href="#wilayah" className="text-xs font-bold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors">Peta Wilayah</a>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-200 active:scale-95 flex items-center gap-2"
            >
              <UserCheck size={16} /> Portal Staf
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden max-w-6xl mx-auto mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4"
            >
              <div className="flex flex-col gap-3">
                <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">Fitur Utama</a>
                <a href="#roles" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">5 Roles RBAC</a>
                <a href="#misi" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">Misi & Target</a>
                <a href="#wilayah" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">Peta Wilayah</a>
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 bg-blue-600 text-white text-center rounded-xl font-bold text-xs uppercase tracking-wider">
                  Masuk Portal Staf
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION WITH DYNAMIC VISUALS */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-4 sm:px-6 bg-gradient-to-b from-blue-50/70 via-white to-slate-50">
        
        {/* Glow Spheres */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-400/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-blue-100/70 border border-blue-200 rounded-full shadow-sm">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                {config.vision_text || 'Sistem Informasi Pemetaan Gizi — Kecamatan Sikur'}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-slate-900 max-w-4xl mx-auto">
              {config.hero_title || 'Digitalisasi Pemetaan & Alokasi Gizi SPPG'}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
              {config.hero_subtitle || 'Optimasi alokasi kelompok penerima manfaat, evaluasi gizi MBG, audit nota belanja OCR, dan survei komoditas pasar secara akurat berbasis PostGIS.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
              >
                Mulai Akses Peta GIS <ArrowRight size={18} />
              </Link>
              <a 
                href="#roles" 
                className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-sm"
              >
                Lihat 5 Peran Akses
              </a>
            </div>
          </motion.div>

          {/* Interactive Mock GIS Dashboard Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="pt-6 max-w-5xl mx-auto"
          >
            <div className="bg-slate-900 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl border border-slate-800 relative overflow-hidden text-left text-white">
              {/* Header Bar */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono text-slate-400">gis-sppg.sikur.go.id/dashboard/mapping</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Activity size={12} className="animate-pulse" /> 14 Desa Kec. Sikur Live
                </div>
              </div>

              {/* Showcase Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 flex flex-col justify-between min-h-[220px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">PetaGIS Tematik</span>
                      <h4 className="text-lg font-black text-white">Unit SPPG & Posyandu Sikur</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-600/30 text-blue-300 rounded-lg text-[10px] font-mono">EPSG:4326</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total SPPG</p>
                      <p className="text-xl font-black text-white">14 Unit</p>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Sekolah/Posyandu</p>
                      <p className="text-xl font-black text-emerald-400">85 Kelompok</p>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Metode Alokasi</p>
                      <p className="text-xs font-bold text-amber-300">Nearest Distance</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 space-y-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Modul Smart Audit</span>
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">OCR Nota Belanja</p>
                        <p className="text-[10px] text-slate-400">Gemini Vision AI</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">Aktif</span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">Survey Komoditas</p>
                        <p className="text-[10px] text-slate-400">Harga Acuan Pasar</p>
                      </div>
                      <span className="text-xs font-bold text-blue-400">Updated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS OVERVIEW SECTION */}
      <section id="fitur" className="py-16 px-4 sm:px-6 bg-white border-y border-slate-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { val: '14 Unit', label: 'SPPG Terdaftar', sub: 'Kecamatan Sikur', icon: Building2, color: 'text-blue-600 bg-blue-50' },
              { val: '85+', label: 'Sekolah & Posyandu', sub: 'Kelompok Penerima', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
              { val: '99.9%', label: 'Akurasi Jarak GIS', sub: 'PostGIS Geography', icon: MapPin, color: 'text-indigo-600 bg-indigo-50' },
              { val: '5 Level', label: 'Hak Akses RBAC', sub: 'Terikat Unit SPPG', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' }
            ].map((stat, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2 hover:bg-white hover:shadow-lg transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} mb-3`}>
                  <stat.icon size={20} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stat.val}</h3>
                <div>
                  <p className="text-xs font-black text-slate-700">{stat.label}</p>
                  <p className="text-[11px] font-medium text-slate-400">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 ROLES MATRIX SECTION */}
      <section id="roles" className="py-24 px-4 sm:px-6 bg-slate-100">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="px-3.5 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-wider">
              Manajemen Hak Akses Terstruktur
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              5 Peran (Roles) & Batasan Akses SPPG
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              Sistem keamanan terikat di masing-masing unit SPPG untuk menjamin integritas data operasional, gizi, dan audit keuangan.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {rolesMatrix.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRoleTab(r.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  activeRoleTab === r.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Active Role Content Card */}
          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-200/80 shadow-xl max-w-4xl mx-auto">
            {rolesMatrix.filter(r => r.id === activeRoleTab).map((role) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{role.badge}</span>
                    <h3 className="text-2xl font-black text-slate-900">{role.name}</h3>
                  </div>
                  <Link 
                    to="/login" 
                    className="px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all w-fit"
                  >
                    Daftar / Masuk Role Ini
                  </Link>
                </div>

                <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
                  {role.desc}
                </p>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Cakupan Fitur Utama:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {role.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-800">{feat}</span>
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
      <section id="misi" className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">
          
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 rounded-[3rem] p-8 sm:p-14 text-white relative overflow-hidden shadow-2xl shadow-blue-500/10">
            <div className="relative z-10 max-w-2xl space-y-6">
              <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] font-black uppercase tracking-widest text-blue-200">
                Inisiatif Strategis Nasional
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {config.mbg_title || 'Makan Bergizi Gratis (MBG)'}
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-medium">
                {config.mbg_desc || 'Program unggulan pemenuhan gizi anak sekolah, balita, dan ibu hamil secara terstruktur di Kecamatan Sikur untuk melahirkan generasi emas Indonesia.'}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold">
                  🥗 Menu MBG Standar Gizi
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold">
                  📍 Alokasi Jarak Terdekat
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold">
                  🔍 Transparency Audit
                </div>
              </div>
            </div>
          </div>

          {/* Missions Grid */}
          <div className="space-y-8">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Misi Utama Badan Gizi</h2>
              <p className="text-xs text-slate-500 font-medium">Tiga pilar layanan utama dalam pemetaan dan alokasi gizi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {missions.map((misi, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200/80 space-y-4 hover:bg-white hover:shadow-xl transition-all"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${misi.color}`}>
                    <misi.icon size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    {misi.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* TARGET BENEFICIARIES SECTION */}
      <section className="py-24 px-4 sm:px-6 bg-blue-600 rounded-[3rem] sm:rounded-[4rem] mx-2 sm:mx-6 my-10 text-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Prioritas Layanan Gizi</h2>
            <p className="text-blue-100 font-medium text-sm">Sasaran utama distribusi bantuan gizi di Kecamatan Sikur.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {targets.map((target, idx) => (
              <div key={idx} className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/15 space-y-4 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center font-black text-lg">
                  0{idx + 1}
                </div>
                <h3 className="text-xl font-black">{config[target.key] || target.label}</h3>
                <p className="text-xs text-blue-100/80 font-medium leading-relaxed">{target.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COVERAGE MAP VILLAGES SECTION WITH SILHOUETTE VECTOR MAP */}
      <section id="wilayah" className="py-24 px-4 sm:px-6 bg-white border-t border-slate-200/60">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-3.5 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-wider">
              Cakupan Batas Wilayah Spasial GIS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Peta Siluet 14 Desa Kecamatan Sikur
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Batas wilayah desa terintegrasi dari data GeoJSON PostGIS SRID 4326. Klik atau sorot desa untuk melihat pratinjau siluet.
            </p>
          </div>

          {/* Grid Layout: Map Silhouette + Village Selector Chips */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left/Top: Vector Map Silhouette */}
            <div className="lg:col-span-7">
              <SikurSilhouetteMap 
                selectedVillage={selectedVillage} 
                onSelectVillage={(vName) => setSelectedVillage(prev => prev === vName ? null : vName)} 
              />
            </div>

            {/* Right/Bottom: 14 Village Chips Selector */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Daftar 14 Desa Resmi</h4>
                {selectedVillage && (
                  <button 
                    onClick={() => setSelectedVillage(null)} 
                    className="text-[10px] font-bold text-blue-600 hover:underline"
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
                      className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin size={14} className={isSelected ? 'text-white' : 'text-blue-600'} />
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
      <footer className="py-16 px-4 sm:px-6 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <MapIcon size={20} />
                </div>
                <span className="text-xl font-black tracking-tight">GIS-SPPG</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {config.footer_text || 'Sistem Informasi Pemetaan dan Alokasi Kelompok Penerima Satuan Pangan Produksi Gizi (SPPG) Kecamatan Sikur, Lombok Timur.'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Kontak Resmi</h4>
              <div className="space-y-2 text-xs text-slate-300 font-medium">
                <p className="flex items-center gap-2"><Phone size={14} className="text-blue-400" /> {config.whatsapp || '+62 812-3456-7890'}</p>
                <p className="flex items-center gap-2"><Globe size={14} className="text-blue-400" /> {config.email || 'info@sppg-sikur.go.id'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Navigasi Cepat</h4>
              <div className="flex flex-col gap-2 text-xs font-bold text-slate-300">
                <Link to="/login" className="hover:text-blue-400 transition-colors">Portal Masuk Staf</Link>
                <Link to="/login" className="hover:text-blue-400 transition-colors">Pendaftaran Akun SPPG</Link>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400 font-medium">
            <p>&copy; 2026 GIS-SPPG Kecamatan Sikur — Badan Gizi Nasional</p>
            <p>PostGIS & GeoAlchemy2 Powered</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
