import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { Map as MapIcon, Phone, Globe, Heart, Shield, Users, ArrowRight, ChevronRight } from 'lucide-react';
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
      <div className="h-screen flex items-center justify-center bg-blue-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden font-['Plus_Jakarta_Sans']">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-blue-100/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <MapIcon size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
               <span className="text-xl font-black tracking-tight leading-none italic text-blue-900">GIS-SPPG</span>
               <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">Badan Gizi Nasional</span>
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-10">
            <div className="hidden lg:flex items-center gap-10">
              <a href="#misi" className="text-xs font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors">Misi</a>
              <a href="#program" className="text-xs font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors">Program</a>
              <a href="#sasaran" className="text-xs font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors">Sasaran</a>
            </div>
            <Link to="/login" className="px-5 py-2.5 lg:px-7 lg:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-blue-200">
              Portal Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] -z-10" />
        <div className="max-w-6xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-8">
               <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
                  {config.vision_text || 'Membangun Bangsa yang Lebih Sehat'}
               </span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-black tracking-tight leading-[1] mb-10 text-slate-900">
              {config.hero_title || 'Misi Badan Gizi Nasional'}
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
              {config.hero_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link to="/login" className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em]">
                Mulai Akses Peta <ArrowRight size={20} />
              </Link>
              <a href="#program" className="w-full sm:w-auto px-12 py-5 bg-white border-2 border-blue-100 text-blue-600 font-black rounded-[2rem] hover:bg-blue-50 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em]">
                Program MBG
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Penerima Manfaat', val: '20M+', sub: 'Seluruh Indonesia' },
                { label: 'Unit SPPG', val: '500+', sub: 'Tersebar di Wilayah' },
                { label: 'Akurasi Data', val: '99.9%', sub: 'PostGIS Spatial' },
                { label: 'Kapasitas Gizi', val: 'Daily', sub: 'Distribusi Rutin' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50">
                   <p className="text-3xl lg:text-4xl font-black text-blue-600 mb-2 tracking-tight">{stat.val}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Program MBG Section */}
      <section id="program" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[4rem] p-10 lg:p-24 overflow-hidden relative shadow-2xl shadow-blue-300/30 group">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
             <div className="relative z-10 max-w-2xl">
                <span className="text-blue-200 font-black text-[10px] uppercase tracking-[0.4em] mb-6 block">Inisiatif Strategis</span>
                <h2 className="text-4xl lg:text-7xl font-black mb-8 text-white leading-tight">{config.mbg_title}</h2>
                <p className="text-lg lg:text-xl text-blue-50/80 leading-relaxed mb-12 font-medium">
                   {config.mbg_desc}
                </p>
                <div className="flex flex-wrap gap-4">
                   <div className="px-8 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white text-xs font-black uppercase tracking-widest">
                      Kedaulatan Pangan
                   </div>
                   <div className="px-8 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white text-xs font-black uppercase tracking-widest">
                      Generasi Emas
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Missions Section */}
      <section id="misi" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
           <div className="flex flex-col lg:flex-row items-end justify-between mb-20 gap-8">
              <div className="max-w-2xl">
                <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">Misi Kegemilangan Bangsa</h2>
                <p className="text-lg text-slate-500 font-medium italic border-l-4 border-blue-600 pl-6">
                  "Menghadirkan senyum sehat di setiap wajah anak Indonesia melalui pemerataan akses gizi yang berkeadilan."
                </p>
              </div>
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                 <Heart size={40} />
              </div>
           </div>
           <div className="grid lg:grid-cols-3 gap-10">
              {missions.map((misi, i) => (
                misi.text && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="p-12 bg-slate-50 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-blue-200/50 transition-all group"
                  >
                    <div className="w-16 h-16 bg-white shadow-lg text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                       <misi.icon size={30} />
                    </div>
                    <p className="text-xl text-slate-700 font-bold leading-relaxed">
                       {misi.text}
                    </p>
                  </motion.div>
                )
              ))}
           </div>
        </div>
      </section>

      {/* Targets Section */}
      <section id="sasaran" className="py-32 px-6 bg-blue-600 rounded-[4rem] lg:rounded-[6rem] mx-4 lg:mx-10 my-20">
        <div className="max-w-7xl mx-auto">
           <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="text-white">
                 <h2 className="text-4xl lg:text-7xl font-black mb-12 leading-tight">Prioritas Layanan Gizi</h2>
                 <div className="space-y-8">
                    {targets.map((target, i) => (
                      <div key={i} className="flex gap-8 p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/10 hover:bg-white/20 transition-all group">
                         <div className="w-14 h-14 bg-white text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shrink-0">
                            {i+1}
                         </div>
                         <div>
                            <h4 className="font-black text-2xl mb-2">{config[target.key] || target.label}</h4>
                            <p className="text-blue-100/70 font-medium">{target.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="relative">
                 <div className="absolute inset-0 bg-white/20 blur-[120px] rounded-full" />
                 <img 
                    src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                    className="relative rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border-8 border-white/10 object-cover aspect-[4/5]"
                    alt="Target Gizi"
                 />
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-16 mb-24">
             <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                    <MapIcon size={24} className="text-white" />
                  </div>
                  <span className="text-3xl font-black tracking-tight italic text-blue-900">GIS-SPPG</span>
                </div>
                <p className="text-slate-500 max-w-md font-medium text-lg leading-relaxed">
                   {config.footer_text}
                </p>
             </div>
             <div>
                <h5 className="font-black text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-10">Kontak Resmi</h5>
                <div className="space-y-6">
                   <div className="flex items-center gap-4 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><Phone size={18} /></div>
                      <span className="font-black text-sm tracking-tight">{config.whatsapp}</span>
                   </div>
                   <div className="flex items-center gap-4 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><Globe size={18} /></div>
                      <span className="font-black text-sm tracking-tight">{config.email}</span>
                   </div>
                </div>
             </div>
             <div>
                <h5 className="font-black text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-10">Tautan Penting</h5>
                <div className="flex flex-col gap-4">
                   {['Tentang BGN', 'Kebijakan Privasi', 'Peta Situs', 'Portal Layanan'].map(link => (
                     <span key={link} className="text-slate-500 font-bold hover:text-blue-600 cursor-pointer transition-all flex items-center gap-2 group text-sm">
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /> {link}
                     </span>
                   ))}
                </div>
             </div>
          </div>
          <div className="pt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                &copy; 2024 Badan Gizi Nasional - Menuju Indonesia Emas
             </p>
             <div className="flex gap-4">
                {['Instagram', 'Twitter', 'Facebook'].map(social => (
                  <div key={social} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer text-slate-400">
                     <span className="text-[11px] font-black uppercase tracking-tight">{social[0]}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
