import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, HeartHandshake, X, CheckCircle2, MoonStar, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const islamicQuotes = [
  {
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    latin: "Inna ma'al 'usri yusraa",
    quote: "Karena sesungguhnya sesudah kesulitan itu ada kemudahan. (QS. Al-Insyirah: 6)",
    source: "Al-Qur'an Al-Karim"
  },
  {
    arabic: "إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ",
    latin: "Innallaha yuhibbu idza 'amila ahadukum 'amalan an yutqinahu",
    quote: "Sesungguhnya Allah sangat mencintai seseorang yang apabila bekerja, ia melakukannya dengan Itqan (profesional, bersungguh-sungguh, dan rapi).",
    source: "HR. Thabrani & Baihaqi"
  },
  {
    arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
    latin: "Khairunnas anfa'uhum linnas",
    quote: "Sebaik-baik manusia adalah yang paling banyak memberikan manfaat bagi sesama.",
    source: "HR. Ahmad & Thabrani"
  },
  {
    arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    latin: "Man salaka thariqan yaltamisu fihi 'ilman sahhalallahu lahu bihi thariqan ilal jannah",
    quote: "Niatkan setiap pekerjaan sebagai niat ibadah dan khidmat. Keringat kebaikanmu akan menjadi saksi pemberat timbangan pahala.",
    source: "Nasihat Keberkahan Kerja"
  }
];

const DailyMotivationModal = ({ isOpen, onClose, userName }) => {
  const [quote, setQuote] = useState(islamicQuotes[0]);

  useEffect(() => {
    if (isOpen) {
      const idx = Math.floor(Math.random() * islamicQuotes.length);
      setQuote(islamicQuotes[idx]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartWork = () => {
    toast.success('Bismillah, selamat bekerja! Semoga harimu penuh keberkahan & Ridho-Nya 🌟', {
      duration: 5000,
      style: {
        borderRadius: '1.25rem',
        background: '#064e3b',
        color: '#ecfdf5',
        padding: '0.875rem 1.25rem',
        fontWeight: 'bold',
        fontSize: '0.875rem'
      }
    });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden relative my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header Banner - Emerald Islamic Aesthetics */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-5 sm:p-6 text-white relative shrink-0">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Easy-to-click Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 z-10"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-amber-400/20 text-amber-300 rounded-2xl flex items-center justify-center border border-amber-400/30 shrink-0">
                <MoonStar size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Assalamu'alaikum, {userName || 'Akhi / Ukhti'}! 🤲
                </h3>
              </div>
            </div>
          </div>

          {/* Body Content - Scrollable if needed on mobile */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">

            {/* Prayer Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-black uppercase tracking-wider text-[10px]">
                <Sparkles size={14} className="text-emerald-600" />
                <span>Doa Sebelum Memulai Pekerjaan</span>
              </div>
              
              {/* Arabic Text */}
              <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 text-center space-y-1 shadow-sm">
                <p className="font-serif text-lg font-bold text-emerald-950 leading-relaxed dir-rtl" lang="ar">
                  بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ
                </p>
                <p className="text-[11px] font-semibold text-emerald-800 italic">
                  "Bismillahi tawakkaltu 'alallah, laa haula wa laa quwwata illaa billaah."
                </p>
              </div>

              <p className="text-[11px] text-emerald-950 leading-relaxed font-medium">
                <strong className="text-emerald-900">Artinya:</strong> "Dengan menyebut nama Allah, aku bertawakal kepada Allah. Tiada daya dan upaya melainkan dengan pertolongan Allah."
              </p>
            </div>

            {/* Islamic Motivation Quote Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
              <div className="flex items-center gap-1.5 text-teal-800 font-black uppercase tracking-wider text-[10px]">
                <BookOpen size={13} className="text-teal-600" />
                <span>Mutiara Hikmah & Motivasi</span>
              </div>

              {quote.arabic && (
                <p className="font-serif text-base font-bold text-slate-900 text-right dir-rtl" lang="ar">
                  {quote.arabic}
                </p>
              )}

              <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">
                "{quote.quote}"
              </p>

              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                — {quote.source}
              </p>
            </div>

          </div>

          {/* Footer Action Button */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleStartWork}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Bismillah, Saya Siap Bekerja</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default DailyMotivationModal;
