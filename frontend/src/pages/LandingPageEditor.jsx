import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Save, Eye, Layout, Type, AlignLeft, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './LandingPage';

const LandingPageEditor = () => {
  const [configs, setConfigs] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const { data, error } = await supabase.from('landing_config').select('*').order('section_name');
    if (error) {
      toast.error('Gagal mengambil data konfigurasi');
    } else {
      setConfigs(data);
      const initialForm = data.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
      setFormData(initialForm);
    }
    setLoading(false);
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(formData).map(([key, value]) => ({
        key,
        value,
        section_name: configs.find(c => c.key === key)?.section_name || 'General'
      }));

      const { error } = await supabase.from('landing_config').upsert(updates, { onConflict: 'key' });
      
      if (error) throw error;
      
      toast.success('Konfigurasi landing page berhasil disimpan!');
      fetchConfigs();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan konfigurasi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-12 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const sections = [...new Set(configs.map(c => c.section_name))];

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Landing Page Editor</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola konten halaman publik secara dinamis.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Eye size={18} /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map(section => (
          <div key={section} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                <Layout size={20} />
              </div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">{section} Section</h3>
            </div>
            <div className="p-8 space-y-6">
              {configs.filter(c => c.section_name === section).map(config => (
                <div key={config.key}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    {config.key.replace('_', ' ').replace(section.toLowerCase(), '')}
                  </label>
                  {config.value.length > 50 ? (
                    <textarea
                      value={formData[config.key] || ''}
                      onChange={(e) => handleInputChange(config.key, e.target.value)}
                      rows={4}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-700 font-medium text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[config.key] || ''}
                      onChange={(e) => handleInputChange(config.key, e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-700 font-medium text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 lg:p-10">
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white"
             >
                <div className="absolute top-6 right-6 z-[70]">
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-110 transition-all active:scale-95"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="w-full h-full overflow-y-auto no-scrollbar">
                   <LandingPage previewData={formData} />
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPageEditor;
