import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Mail, 
  Lock, 
  Loader2, 
  Map as MapIcon, 
  ArrowRight, 
  ChevronLeft,
  Building2,
  User,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Shield,
  Apple,
  DollarSign,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Check,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sign Up Form States
  const [sppgUnits, setSppgUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(null);
  const [signUpForm, setSignUpForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'sppg_head',
    sppg_id: ''
  });

  // Fetch SPPG units for Sign Up dropdown
  useEffect(() => {
    const fetchSppgUnits = async () => {
      setLoadingUnits(true);
      try {
        const { data } = await api.get('/sppg');
        setSppgUnits(data || []);
      } catch (err) {
        console.error("Gagal memuat unit SPPG:", err);
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchSppgUnits();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email atau password salah.' : error.message);
      setLoading(false);
    } else {
      if (data.session) {
        localStorage.setItem('access_token', data.session.access_token);
      }
      navigate('/dashboard');
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSignUpSuccess(null);

    if (signUpForm.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    if (!signUpForm.sppg_id) {
      setError('Silakan pilih Unit SPPG terikat.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: signUpForm.full_name.trim(),
        email: signUpForm.email.trim(),
        password: signUpForm.password,
        role: signUpForm.role,
        sppg_id: parseInt(signUpForm.sppg_id)
      };

      await api.post('/users', payload);
      
      setSignUpSuccess('Pendaftaran berhasil! Otentikasi masuk otomatis...');
      
      // Auto login after sign up
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email: signUpForm.email.trim(),
        password: signUpForm.password
      });

      if (!loginErr && data.session) {
        localStorage.setItem('access_token', data.session.access_token);
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setEmail(signUpForm.email.trim());
        setPassword('');
        setIsSignUp(false);
        setSignUpSuccess('Akun berhasil dibuat! Silakan masuk.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Gagal mendaftarkan akun. Email mungkin sudah terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      id: 'sppg_head',
      label: 'Kepala SPPG',
      icon: Shield,
      badgeColor: 'bg-emerald-500/10 text-emerald-600'
    },
    {
      id: 'nutrition_inspector',
      label: 'Pengawas Gizi',
      icon: Apple,
      badgeColor: 'bg-purple-500/10 text-purple-600'
    },
    {
      id: 'finance_inspector',
      label: 'Pengawas Keuangan',
      icon: DollarSign,
      badgeColor: 'bg-amber-500/10 text-amber-700'
    }
  ];

  return (
    <div className="h-screen bg-slate-100 flex flex-col lg:flex-row font-['Plus_Jakarta_Sans'] selection:bg-blue-600 selection:text-white overflow-hidden">
      
      {/* LEFT PANEL: HERO BRAND SHOWCASE (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 relative overflow-hidden flex-col justify-between p-8 xl:p-12 border-r border-slate-800/80">
        
        {/* Glow Spheres */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/25 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Top Branding Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20">
              <MapIcon size={20} className="text-white" />
            </div>
            <div>
              <span className="font-black tracking-wider text-white text-base block leading-none">GIS-SPPG</span>
              <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest">Portal Gizi Nasional</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-[10px] font-bold text-blue-200 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Kec. Sikur
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-6 space-y-5 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-400/20 rounded-lg text-[10px] font-black text-blue-300 uppercase tracking-widest">
              <Activity size={12} className="text-blue-400" /> Platform Terpadu Spasial
            </div>

            <h1 className="text-2xl xl:text-3xl font-black tracking-tight leading-tight text-white">
              Pemetaan & Pengawasan Alokasi Gizi SPPG
            </h1>
            
            <p className="text-xs xl:text-sm text-slate-300 font-medium leading-relaxed">
              Sistem informasi spasial alokasi kelompok penerima, survei komoditas bahan baku, dan pengawasan gizi multi-role terenkripsi.
            </p>
          </motion.div>

          {/* Key Feature Badges */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <ShieldCheck size={14} /> 5 Level Akses
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                Terikat unit SPPG.
              </p>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl space-y-0.5">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                <Sparkles size={14} /> Survey & Audit OCR
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                Deteksi harga & RAB.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Credits */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>PostGIS & Supabase Auth</span>
          <span>v2.4.0</span>
        </div>
      </div>

      {/* RIGHT PANEL: COMPACT FORM CONTAINER (Fits inside viewport without excessive scrolling) */}
      <div className="flex-1 h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto">
        
        {/* Top Header Row */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <MapIcon size={16} />
            </div>
            <span className="font-black text-slate-900 tracking-tight text-sm">GIS-SPPG</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-[11px] font-black uppercase tracking-wider bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <ChevronLeft size={14} /> Beranda
          </button>
        </div>

        {/* Center Compact Form Card */}
        <div className="w-full max-w-md mx-auto my-auto shrink-0">
          
          <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/80 space-y-4">
            
            {/* Compact Mode Switcher Pills */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); setSignUpSuccess(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  !isSignUp 
                    ? 'bg-white text-blue-600 shadow-sm font-black' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn size={14} /> Masuk
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); setSignUpSuccess(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  isSignUp 
                    ? 'bg-white text-blue-600 shadow-sm font-black' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus size={14} /> Sign Up
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!isSignUp ? (
                /* LOGIN FORM */
                <motion.div
                  key="compact-login-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Selamat Datang Kembali</h2>
                    <p className="text-slate-500 font-medium text-xs mt-0.5">Masuk ke portal dengan akun terdaftar Anda.</p>
                  </div>

                  {signUpSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{signUpSuccess}</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-3">
                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-xs text-slate-800"
                          placeholder="nama@domain.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kata Sandi</label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-xs text-slate-800"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                        <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-700">Ingat Saya</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 mt-1"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <>Masuk Ke Dashboard <ArrowRight size={16} /></>}
                    </button>
                  </form>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Belum punya akun?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="font-black text-blue-600 hover:underline"
                      >
                        Daftar Akun Baru (Sign Up)
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* SIGN UP FORM (Compact Zero-Scroll Layout) */
                <motion.div
                  key="compact-signup-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Pendaftaran Staf Baru</h2>
                    <p className="text-slate-500 font-medium text-[11px] mt-0.5">Pilih peran dan unit SPPG terikat untuk akun Anda.</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                      <AlertCircle size={15} className="text-red-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignUpSubmit} className="space-y-3">
                    
                    {/* Role Choice Horizontal Grid */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Peran / Jabatan <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {roleOptions.map((option) => {
                          const isSelected = signUpForm.role === option.id;
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSignUpForm(p => ({ ...p, role: option.id }))}
                              className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20 font-bold'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className={`p-1 rounded-lg ${option.badgeColor}`}>
                                <Icon size={14} />
                              </div>
                              <span className="text-[10px] font-black leading-tight text-center truncate w-full">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Unit SPPG Compact Selector */}
                    <div className="space-y-1 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-blue-950 flex items-center gap-1">
                          <Building2 size={14} className="text-blue-600 shrink-0" />
                          Unit SPPG Terikat <span className="text-red-500">*</span>
                        </label>
                      </div>
                      {loadingUnits ? (
                        <div className="py-1 text-[11px] text-blue-600 font-bold flex items-center gap-1.5">
                          <Loader2 className="animate-spin" size={13} /> Memuat SPPG...
                        </div>
                      ) : (
                        <select
                          required
                          value={signUpForm.sppg_id}
                          onChange={(e) => setSignUpForm(p => ({ ...p, sppg_id: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 outline-none"
                        >
                          <option value="">— Pilih Unit SPPG —</option>
                          {sppgUnits.map(unit => (
                            <option key={unit.id} value={unit.id}>
                              {unit.nama} ({unit.kode_sppg || `ID #${unit.id}`}) - {unit.alamat_desa || 'Sikur'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Nama Lengkap */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Nama Lengkap Pengguna</label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={15} />
                        <input
                          type="text"
                          required
                          value={signUpForm.full_name}
                          onChange={(e) => setSignUpForm(p => ({ ...p, full_name: e.target.value }))}
                          className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-xs text-slate-800"
                          placeholder="Contoh: Budi Santoso, S.ST"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={15} />
                        <input
                          type="email"
                          required
                          value={signUpForm.email}
                          onChange={(e) => setSignUpForm(p => ({ ...p, email: e.target.value }))}
                          className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-xs text-slate-800"
                          placeholder="email@domain.com"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm (2 Columns) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Password</label>
                        <div className="relative group">
                          <input
                            type={showSignUpPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={signUpForm.password}
                            onChange={(e) => setSignUpForm(p => ({ ...p, password: e.target.value }))}
                            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-[11px] text-slate-800"
                            placeholder="Min 6 karakter"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showSignUpPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Konfirmasi</label>
                        <div className="relative group">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={signUpForm.confirmPassword}
                            onChange={(e) => setSignUpForm(p => ({ ...p, confirmPassword: e.target.value }))}
                            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-[11px] text-slate-800"
                            placeholder="Ulangi password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-[0.98] disabled:opacity-50 mt-1"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <>Daftar Akun Baru <ArrowRight size={16} /></>}
                    </button>
                  </form>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Sudah memiliki akun?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="font-black text-blue-600 hover:underline"
                      >
                        Masuk ke Akun
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>



        </div>

      </div>
    </div>
  );
};

export default Login;
