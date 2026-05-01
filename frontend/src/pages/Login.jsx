import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Map as MapIcon, ArrowRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
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

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-['Plus_Jakarta_Sans'] selection:bg-blue-100 overflow-hidden">
      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-900 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-30" />

        <div className="relative z-10 text-white max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/20">
              <MapIcon size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-[1.1] mb-8">
              Portal Digital Pemetaan Gizi Nasional
            </h1>
            <p className="text-xl text-blue-100/80 leading-relaxed font-medium mb-12">
              Masuk untuk mengelola data pemetaan, analisis spasial, dan distribusi bantuan gizi di seluruh wilayah.
            </p>
            <div className="flex gap-4">
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest">
                PostGIS Powered
              </div>
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest">
                Secure Access
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-[120px]" />
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center p-8 pt-24 lg:p-24 relative bg-white">
        <div className="absolute top-10 left-10 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapIcon size={16} className="text-white" />
            </div>
            <span className="font-black italic text-blue-900">GIS-SPPG</span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-10 text-xs font-black uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Kembali ke Beranda
            </button>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Selamat Datang Kembali</h2>
            <p className="text-slate-500 font-medium mb-10 text-sm">Masuk dengan akun portal admin Anda untuk melanjutkan.</p>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 text-red-600 p-5 rounded-[1.5rem] text-xs font-bold border border-red-100 flex items-center gap-3"
                >
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Alamat Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-sm text-slate-700"
                    placeholder="nama@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kata Sandi</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all font-medium text-sm text-slate-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/20" />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Ingat Saya</span>
                </label>
                <button type="button" className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">Lupa Sandi?</button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Masuk Ke Dashboard <ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                Akses Terbatas. Seluruh aktivitas dicatat dalam sistem Audit Trail Badan Gizi Nasional.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
