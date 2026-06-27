import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';

const FormModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onSubmit, 
  isLoading, 
  submitLabel = 'Simpan Data' 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm will-change-transform"
          />

          {/* Animated Wrapper (transform only, no overflow/rounding) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl flex flex-col"
          >
            {/* Visual Container (overflow/rounding here, no transform interference) */}
            <div className="bg-blue-600 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-blue-600 will-change-transform">
              {/* Header */}
              <div className="p-8 bg-blue-600 text-white flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black tracking-tight">{title}</h3>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Input Formulir Data</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 bg-white/10 text-white hover:bg-white/20 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar bg-white">
                {children}
              </div>

              {/* Footer */}
              <div className="p-6 lg:p-8 border-t border-slate-50 bg-white flex justify-end gap-3 shrink-0 rounded-b-[2.5rem]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-4 rounded-2xl font-bold text-sm text-slate-500 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  onClick={onSubmit}
                  disabled={isLoading}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {submitLabel}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FormModal;
