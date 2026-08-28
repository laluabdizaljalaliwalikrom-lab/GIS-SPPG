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
        className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header Banner */}
          <div className="bg-slate-900 px-6 py-4 text-white relative shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-400/20 text-amber-300 rounded-lg flex items-center justify-center border border-amber-400/30 shrink-0">
                <MoonStar size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Assalamu'alaikum, {userName || 'Rekan'}! 🤲
                </h3>
                <p className="text-xs text-slate-400 font-medium">Motivasi & doa harian</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Tutup modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-3.5 overflow-y-auto flex-1 text-slate-800 text-xs bg-white">

            {/* Prayer Box */}
            <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200/70 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                <Sparkles size={13} className="text-emerald-600" />
                <span>Doa Sebelum Memulai Pekerjaan</span>
              </div>
              
              {/* Arabic Text */}
              <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center space-y-1">
                <p className="font-serif text-base font-bold text-emerald-950 leading-relaxed dir-rtl" lang="ar">
                  بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ
                </p>
                <p className="text-[11px] font-medium text-emerald-800 italic">
                  "Bismillahi tawakkaltu 'alallah, laa haula wa laa quwwata illaa billaah."
                </p>
              </div>

              <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                <strong>Artinya:</strong> "Dengan menyebut nama Allah, aku bertawakal kepada Allah. Tiada daya dan upaya melainkan dengan pertolongan Allah."
              </p>
            </div>

            {/* Islamic Motivation Quote Box */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs">
                <BookOpen size={13} />
                <span>Mutiara Hikmah</span>
              </div>

              {quote.arabic && (
                <p className="font-serif text-sm font-bold text-slate-900 text-right dir-rtl" lang="ar">
                  {quote.arabic}
                </p>
              )}

              <p className="text-xs text-slate-700 leading-relaxed italic font-medium">
                "{quote.quote}"
              </p>

              <p className="text-[10px] text-slate-400 font-medium text-right">
                — {quote.source}
              </p>
            </div>

          </div>

          {/* Footer Action Button */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleStartWork}
              className="btn-primary w-full text-xs"
            >
              <CheckCircle2 size={15} />
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
