import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSPPG } from '../hooks/useSPPG';
import SPPGChecklist from '../components/SPPGChecklist';
import { 
  Search, 
  Building2, 
  Activity, 
  ChevronDown,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ScoreBar = ({ label, score, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
      <span className="text-slate-400 truncate pr-1">{label}</span>
      <span className="text-slate-800">{score}%</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  </div>
);

const RaportPage = () => {
  const { profile } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSppg, setSelectedSppg] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { sppgs, isLoading } = useSPPG();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSppgs = sppgs.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.kode_sppg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSppgDetails = sppgs.find(s => s.id === selectedSppg?.id);

  const getOverallScore = (sppg) => {
    if (!sppg) return 0;
    return Math.round(
      ((sppg.infrastruktur_score || 0) +
       (sppg.peralatan_score || 0) +
       (sppg.k3_lingkungan_score || 0) +
       (sppg.paket_mbg_score || 0) +
       (sppg.distribusi_score || 0) +
       (sppg.dokumentasi_score || 0) +
       (sppg.penerima_manfaat_score || 0) +
       (sppg.tenaga_kerja_score || 0) +
       (sppg.sertifikat_iso_score || 0) +
       (sppg.administrasi_score || 0)) / 10
    );
  };

  return (
    <div className="h-full flex flex-col gap-5 animate-in fade-in duration-300 overflow-hidden">
      {/* Top Selector & Score Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-5 shrink-0 relative z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-header flex items-center gap-2">
              <ClipboardList className="text-blue-600" size={20} /> Raport Kinerja SPPG
            </h1>
            <p className="page-subtitle">Evaluasi & Standardisasi Unit</p>
          </div>

          <div className="relative w-full md:w-[420px]" ref={dropdownRef}>
            <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-100 transition-all flex items-center justify-between">
              <span className="truncate flex items-center gap-2">
                <Building2 size={15} className="text-blue-600 shrink-0" />
                {activeSppgDetails ? activeSppgDetails.nama : 'Pilih Unit SPPG...'}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 max-h-[280px] overflow-hidden z-50">
                  <div className="relative shrink-0">
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari SPPG..." autoFocus
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-0.5 no-scrollbar">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-600"></div> Memuat...
                      </div>
                    ) : filteredSppgs.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">Tidak ada SPPG</div>
                    ) : filteredSppgs.map(sppg => {
                      const isSelected = selectedSppg?.id === sppg.id;
                      return (
                        <button key={sppg.id} onClick={() => { setSelectedSppg(sppg); setIsDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                          <span className="truncate pr-2">{sppg.nama}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{getOverallScore(sppg)}%</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {activeSppgDetails && (
          <div className="border-t border-slate-100 pt-5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div>
                <h4 className="text-base font-semibold text-slate-800">{activeSppgDetails.nama}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Kode: {activeSppgDetails.kode_sppg}</p>
              </div>
              <div className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0">
                <Activity size={13} className="animate-pulse" /> Score: {getOverallScore(activeSppgDetails)}%
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3">
              <ScoreBar label="Infrastruktur" score={activeSppgDetails.infrastruktur_score || 0} color="bg-emerald-500" />
              <ScoreBar label="Peralatan" score={activeSppgDetails.peralatan_score || 0} color="bg-indigo-500" />
              <ScoreBar label="K3 & Lingkungan" score={activeSppgDetails.k3_lingkungan_score || 0} color="bg-rose-500" />
              <ScoreBar label="Program MBG" score={activeSppgDetails.paket_mbg_score || 0} color="bg-pink-500" />
              <ScoreBar label="Distribusi" score={activeSppgDetails.distribusi_score || 0} color="bg-amber-500" />
              <ScoreBar label="Dokumentasi" score={activeSppgDetails.dokumentasi_score || 0} color="bg-cyan-500" />
              <ScoreBar label="Penerima Manfaat" score={activeSppgDetails.penerima_manfaat_score || 0} color="bg-violet-500" />
              <ScoreBar label="Tenaga Kerja" score={activeSppgDetails.tenaga_kerja_score || 0} color="bg-blue-500" />
              <ScoreBar label="Sertifikasi & ISO" score={activeSppgDetails.sertifikat_iso_score || 0} color="bg-orange-500" />
              <ScoreBar label="Administrasi" score={activeSppgDetails.administrasi_score || 0} color="bg-slate-500" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Checklist */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden min-h-0 relative z-10">
        <AnimatePresence mode="wait">
          {activeSppgDetails ? (
            <motion.div key={activeSppgDetails.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 shrink-0">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Checklist Penilaian Raport</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Lengkapi kriteria untuk evaluasi kinerja</p>
                </div>
                {(profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator') ? (
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Akses Diberikan</span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">Hanya Baca</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
                <SPPGChecklist sppgId={activeSppgDetails.id} key={activeSppgDetails.id} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center py-20">
              <Building2 size={36} className="text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-500">Belum Ada Unit Dipilih</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">Pilih salah satu unit SPPG di dropdown untuk melihat detail raport.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RaportPage;
