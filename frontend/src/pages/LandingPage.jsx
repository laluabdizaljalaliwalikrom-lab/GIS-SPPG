import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { Map as MapIcon, Phone, Globe, Heart, Shield, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = ({ previewData = null }) => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

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
        const configMap = data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
        setConfig(configMap);
      }
      setLoading(false);
    };

    fetchConfig();
  }, [previewData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050b1a]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const missions = [
    { id: 1, text: config.mission_1, icon: Heart },
    { id: 2, text: config.mission_2, icon: Shield },
    { id: 3, text: config.mission_3, icon: Users },
  ];

  const targets = [
    { key: 'sasaran_students', label: 'Siswa Sekolah', desc: 'PAUD, SD, SMP, hingga SMA' },
    { key: 'sasaran_children', label: 'Anak & Balita', desc: 'Pemenuhan gizi di masa pertumbuhan' },
    { key: 'sasaran_mothers', label: 'Ibu Hamil', desc: 'Dukungan gizi untuk kesehatan ibu & janin' },
  ];

  return (
    <div className="min-h-screen bg-[#050b1a] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#050b1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MapIcon size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight leading-none italic">GIS-SPPG</span>
              <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-1">Badan Gizi Nasional</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <a href="#misi" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Misi</a>
            <a href="#program" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Program</a>
            <a href="#sasaran" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Sasaran</a>
            <Link to="/login" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-blue-500/20">
              Portal Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-blue-600/20 rounded-full blur-[140px] -z-10" />
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                {config.vision_text || 'Membangun Bangsa yang Lebih Sehat'}
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              {config.hero_title || 'Misi Badan Gizi Nasional'}
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              {config.hero_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link to="/login" className="w-full sm:w-auto px-12 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-2xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-3 text-sm">
                Akses Portal Pemetaan <ArrowRight size={18} />
              </Link>
              <a href="#program" className="w-full sm:w-auto px-12 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-sm">
                Lihat Program MBG
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Program MBG Section */}
      <section id="program" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-[4rem] p-8 lg:p-20 overflow-hidden relative group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            <div className="relative z-10 max-w-2xl">
              <span className="text-blue-200 font-black text-[10px] uppercase tracking-[0.4em] mb-4 block">Program Unggulan</span>
              <h2 className="text-4xl lg:text-6xl font-black mb-6">{config.mbg_title}</h2>
              <p className="text-lg text-blue-100/80 leading-relaxed mb-10">
                {config.mbg_desc}
              </p>
              <div className="flex gap-4">
                <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-sm font-bold">
                  Hingga 20 Juta Penerima
                </div>
                <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-sm font-bold">
                  Distribusi SPPG Digital
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missions Section */}
      <section id="misi" className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4 italic">Fokus & Misi Kami</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {missions.map((misi, i) => (
              misi.text && (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="p-10 bg-white/5 rounded-[3rem] border border-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <misi.icon size={28} />
                  </div>
                  <p className="text-lg text-slate-300 font-medium leading-relaxed italic">
                    "{misi.text}"
                  </p>
                </motion.div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Targets Section */}
      <section id="sasaran" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black mb-12">Siapa Yang Kami Layani?</h2>
              <div className="space-y-6">
                {targets.map((target, i) => (
                  <div key={i} className="flex gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all group">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                      <span className="font-black">0{i + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-xl mb-1">{config[target.key] || target.label}</h4>
                      <p className="text-sm text-slate-500">{target.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full" />
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                className="relative rounded-[4rem] shadow-2xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-700"
                alt="Target Gizi"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 bg-[#030712] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-12 mb-20">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <MapIcon size={20} />
                </div>
                <span className="text-2xl font-black tracking-tight italic">GIS-SPPG</span>
              </div>
              <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                {config.footer_text}
              </p>
            </div>
            <div>
              <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-8">Hubungi Kami</h5>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors">
                  <Phone size={16} /> <span className="text-sm font-bold">{config.whatsapp}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors">
                  <Globe size={16} /> <span className="text-sm font-bold">{config.email}</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-8">Media Sosial</h5>
              <div className="flex gap-4">
                {['Instagram', 'Twitter', 'Facebook'].map(social => (
                  <div key={social} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-all cursor-pointer">
                    <span className="text-[10px] font-bold">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
            Sistem Informasi Geospasial SPPG - Powered by Badan Gizi Nasional
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
