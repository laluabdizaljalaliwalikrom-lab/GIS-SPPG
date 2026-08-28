import { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl flex flex-col my-auto"
        >
          <div className="bg-white rounded-xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Input & kelola data formulir</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
              {children}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {submitLabel}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default FormModal;
