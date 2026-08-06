import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Save, Eye, Layout, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './LandingPage';
import { useLandingConfig } from '../hooks/useLandingConfig';
import { useQueryClient } from '@tanstack/react-query';

const LandingPageEditor = () => {
  const queryClient = useQueryClient();
  const { data: configs = [], isLoading: loading } = useLandingConfig();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize form data when config loads
  useEffect(() => {
    if (configs.length > 0 && Object.keys(formData).length === 0) {
      const initialForm = configs.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
      // Use setTimeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setFormData(initialForm);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [configs, formData]);

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
      queryClient.invalidateQueries({ queryKey: ['landing_config'] });
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Landing Page Editor</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola konten official Badan Gizi Nasional.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex-1 lg:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <Eye size={18} /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 lg:flex-none px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            Simpan
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
      {showPreview && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 lg:p-8 overflow-hidden"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-full max-w-7xl max-h-[92vh] my-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="absolute top-4 right-4 z-[70]">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-3 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95 cursor-pointer"
                  aria-label="Tutup pratinjau"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="w-full h-full overflow-y-auto custom-scrollbar">
                <LandingPage previewData={formData} />
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default LandingPageEditor;
