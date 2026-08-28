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
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-['Plus_Jakarta_Sans'] selection:bg-blue-600 selection:text-white">
      
      {/* LEFT PANEL: HERO BRAND SHOWCASE (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-8 xl:p-12 border-r border-slate-800 text-white">
        
        {/* Subtle grid pattern & soft glow */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />
        
        {/* Top Branding Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <MapIcon size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base block leading-none">GIS-SPPG</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Portal Gizi Terpadu</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Kecamatan Sikur
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs font-semibold text-blue-400">
              <Activity size={13} /> Platform Spasial Terpadu
            </div>

            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight text-white">
              Pemetaan & Pengawasan Distribusi Gizi SPPG
            </h1>
            
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              Sistem informasi geografis untuk alokasi kelompok penerima manfaat, survei bahan baku, dan pengawasan raport kinerja unit SPPG.
            </p>
          </motion.div>

          {/* Key Feature Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <ShieldCheck size={15} /> 5 Level Akses
              </div>
              <p className="text-xs text-slate-400 font-normal leading-snug">
                Keamanan & batas wewenang terikat unit.
              </p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <Sparkles size={15} /> Survey & Audit OCR
              </div>
              <p className="text-xs text-slate-400 font-normal leading-snug">
                Pencocokan harga pasar & nota otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Credits */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
          <span>PostGIS & Supabase Auth</span>
          <span>v2.4.0</span>
        </div>
      </div>

      {/* RIGHT PANEL: FORM CONTAINER */}
      <div className="flex-1 min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-10 overflow-y-auto">
        
        {/* Top Header Row */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <MapIcon size={16} />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-sm">GIS-SPPG</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors text-xs font-semibold bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm ml-auto"
          >
            <ChevronLeft size={15} /> Beranda
          </button>
        </div>

        {/* Center Form Card */}
        <div className="w-full max-w-md mx-auto my-auto shrink-0 py-4">
          
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            
            {/* Mode Switcher Tabs */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); setSignUpSuccess(null); }}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  !isSignUp 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn size={14} /> Masuk
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); setSignUpSuccess(null); }}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  isSignUp 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus size={14} /> Daftar Akun
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!isSignUp ? (
                /* LOGIN FORM */
                <motion.div
                  key="compact-login-form"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
                    <p className="text-slate-500 font-normal text-xs mt-1">Masuk dengan akun terdaftar Anda.</p>
                  </div>

                  {signUpSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs font-medium border border-emerald-200 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>{signUpSuccess}</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium border border-red-100 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-3.5">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
                          placeholder="nama@domain.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Kata Sandi</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm active:scale-[0.98] disabled:opacity-50 mt-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <>Masuk Ke Dashboard <ArrowRight size={16} /></>}
                    </button>
                  </form>

                  <div className="pt-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                      Belum punya akun?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        Daftar Akun Baru
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* SIGN UP FORM (Clean SaaS Layout) */
                <motion.div
                  key="compact-signup-form"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pendaftaran Staf</h2>
                    <p className="text-slate-500 font-normal text-xs mt-1">Pilih peran dan unit SPPG terikat untuk akun Anda.</p>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium border border-red-100 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                    
                    {/* Role Choice Horizontal Grid */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Peran / Jabatan <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-3 gap-2">
                        {roleOptions.map((option) => {
                          const isSelected = signUpForm.role === option.id;
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSignUpForm(p => ({ ...p, role: option.id }))}
                              className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <div className={`p-1.5 rounded-md ${option.badgeColor}`}>
                                <Icon size={16} />
                              </div>
                              <span className="text-[11px] font-medium leading-tight text-center truncate w-full">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Unit SPPG Selector */}
                    <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 size={15} className="text-blue-600 shrink-0" />
                          Unit SPPG Terikat <span className="text-red-500">*</span>
                        </label>
                      </div>
                      {loadingUnits ? (
                        <div className="py-1 text-xs text-blue-600 font-medium flex items-center gap-1.5">
                          <Loader2 className="animate-spin" size={14} /> Memuat SPPG...
                        </div>
                      ) : (
                        <select
                          required
                          value={signUpForm.sppg_id}
                          onChange={(e) => setSignUpForm(p => ({ ...p, sppg_id: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Nama Lengkap</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={signUpForm.full_name}
                          onChange={(e) => setSignUpForm(p => ({ ...p, full_name: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400"
                          placeholder="Nama lengkap Anda"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          value={signUpForm.email}
                          onChange={(e) => setSignUpForm(p => ({ ...p, email: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400"
                          placeholder="email@domain.com"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm (2 Columns) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Password</label>
                        <div className="relative">
                          <input
                            type={showSignUpPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={signUpForm.password}
                            onChange={(e) => setSignUpForm(p => ({ ...p, password: e.target.value }))}
                            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400"
                            placeholder="Min 6 karakter"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showSignUpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700">Konfirmasi</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={signUpForm.confirmPassword}
                            onChange={(e) => setSignUpForm(p => ({ ...p, confirmPassword: e.target.value }))}
                            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400"
                            placeholder="Ulangi password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm active:scale-[0.98] disabled:opacity-50 mt-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <>Daftar Akun Baru <ArrowRight size={16} /></>}
                    </button>
                  </form>

                  <div className="pt-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                      Sudah memiliki akun?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="font-semibold text-blue-600 hover:underline"
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
