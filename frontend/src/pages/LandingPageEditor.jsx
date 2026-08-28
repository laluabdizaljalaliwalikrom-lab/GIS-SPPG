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
    <div className="max-w-4xl space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Landing Page Editor</h1>
          <p className="page-subtitle">Kelola konten dan informasi publik Badan Gizi Nasional.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="btn-secondary"
          >
            <Eye size={16} /> Pratinjau
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map(section => (
          <div key={section} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Layout size={16} />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">{section} Section</h3>
            </div>
            <div className="p-5 space-y-4">
              {configs.filter(c => c.section_name === section).map(config => (
                <div key={config.key} className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 capitalize">
                    {config.key.replace(/_/g, ' ').replace(section.toLowerCase(), '')}
                  </label>
                  {config.value.length > 50 ? (
                    <textarea
                      value={formData[config.key] || ''}
                      onChange={(e) => handleInputChange(config.key, e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-slate-800 font-medium text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[config.key] || ''}
                      onChange={(e) => handleInputChange(config.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-slate-800 font-medium text-sm"
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
            className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-6 overflow-hidden"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-full max-w-7xl max-h-[92vh] my-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="absolute top-3 right-3 z-[70]">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-2 bg-slate-900/90 hover:bg-slate-900 text-white rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                  aria-label="Tutup pratinjau"
                >
                  <X size={18} />
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

