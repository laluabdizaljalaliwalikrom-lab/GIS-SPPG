import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { Map as MapIcon, ChevronRight, Info, Phone, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = ({ previewData = null }) => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (previewData) {
      setConfig(previewData);
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      const { data, error } = await supabase.from('landing_config').select('key, value');
      if (error) {
        console.error('Error fetching landing config:', error);
      } else {
        const configMap = data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
        setConfig(configMap);
      }
      setLoading(false);
    };

    fetchConfig();
  }, [previewData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#050b1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MapIcon size={20} />
            </div>
            <span className="text-xl font-black tracking-tight italic">GIS-SPPG</span>
          </div>
          <div className="flex items-center gap-8">
            <Link to="/login" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition-all active:scale-95">
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 inline-block">
              Digital Geospasial Solution
            </span>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              {config.hero_title || 'Sistem Informasi Pemetaan SPPG Digital'}
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              {config.hero_subtitle || 'Meningkatkan transparansi dan efisiensi distribusi unit gizi SPPG melalui teknologi geospasial.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                Mulai Analisis <ChevronRight size={20} />
              </Link>
              <button className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3">
                Pelajari Lebih Lanjut
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-black mb-8">
                {config.about_title || 'Misi Kami'}
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-10">
                {config.about_description || 'Menyediakan data pemetaan yang akurat untuk memastikan setiap kelompok penerima mendapatkan pelayanan gizi yang optimal.'}
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Globe, title: 'Real-time Data', desc: 'Pemantauan distribusi secara langsung.' },
                  { icon: Info, title: 'Analisis Akurat', desc: 'Metodologi pemetaan berbasis koordinat.' }
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5">
                    <item.icon className="text-blue-500 mb-4" size={24} />
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-video bg-gradient-to-br from-blue-600 to-blue-900 rounded-[3rem] overflow-hidden shadow-2xl group"
            >
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
                    <MapIcon size={32} className="text-white" />
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#030712]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapIcon size={16} />
            </div>
            <span className="font-black tracking-tight italic">GIS-SPPG</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {config.footer_text || '© 2024 GIS-SPPG. All rights reserved.'}
          </p>
          <div className="flex items-center gap-6 text-slate-500">
             <Phone size={20} className="hover:text-white cursor-pointer transition-colors" />
             <Globe size={20} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
