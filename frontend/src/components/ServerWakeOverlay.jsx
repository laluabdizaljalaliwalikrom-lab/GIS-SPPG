import { useState, useEffect, useRef } from 'react';
import { Moon, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isWakePending } from '../api';

const CAPTIONS = [
  'Membangunkan server…',
  'Memanaskan mesin…',
  'Menyambungkan database…',
  'Menyiapkan data…',
];

function ServerWakeOverlay() {
  const [waking, setWaking] = useState(isWakePending);
  const [elapsed, setElapsed] = useState(0);
  const [captionIdx, setCaptionIdx] = useState(0);
  const startRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const onWake = () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      startRef.current = Date.now();
      setElapsed(0);
      setCaptionIdx(0);
      setWaking(true);
    };
    const onAwake = () => {
      const shown = Date.now() - (startRef.current || Date.now());
      const delay = shown < 1200 ? 1200 - shown : 0;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setWaking(false), delay);
    };
    window.addEventListener('sppg:server-waking', onWake);
    window.addEventListener('sppg:server-awake', onAwake);
    return () => {
      window.removeEventListener('sppg:server-waking', onWake);
      window.removeEventListener('sppg:server-awake', onAwake);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!waking) return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [waking]);

  useEffect(() => {
    if (!waking) return;
    const t = setInterval(() => setCaptionIdx((i) => (i + 1) % CAPTIONS.length), 3500);
    return () => clearInterval(t);
  }, [waking]);

  return (
    <AnimatePresence>
      {waking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-8 text-center"
          >
            <div className="relative mx-auto w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-5">
              <Moon className="text-blue-500" size={26} />
              <span className="absolute top-0 -right-1 text-amber-500 font-black animate-bounce select-none">z</span>
              <span className="absolute top-3 -right-5 text-amber-400 font-black animate-bounce select-none" style={{ animationDelay: '0.15s' }}>z</span>
              <span className="absolute top-7 -right-9 text-amber-300 font-black animate-bounce select-none" style={{ animationDelay: '0.3s' }}>z</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Server sedang tidur…</h2>
            <p className="text-sm text-slate-500 font-medium mt-1.5">
              Mohon menunggu, server sedang dibangunkan.
            </p>

            <div className="mt-5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-blue-600 rounded-full animate-pulse" />
            </div>

            <p className="mt-4 text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center justify-center gap-2">
              <Coffee size={14} className="animate-pulse" />
              {CAPTIONS[captionIdx]}
            </p>

            <p className="mt-2 text-[11px] text-slate-400 font-medium">
              Sudah menunggu {elapsed} detik — biasanya ±1 menit saat pertama diakses setelah lama tidak aktif.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ServerWakeOverlay;