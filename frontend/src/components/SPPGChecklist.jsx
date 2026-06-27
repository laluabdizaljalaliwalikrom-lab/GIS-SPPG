import { useState, useEffect } from 'react';
import { useSPPG } from '../hooks/useSPPG';
import { Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const EMPTY_ARRAY = [];

const SPPGChecklist = ({ sppgId, onUpdate }) => {
  const { raportPoints, useChecklist, updateChecklist, isUpdatingChecklist } = useSPPG();
  const { data: currentAnswers, isLoading: loadingAnswers } = useChecklist(sppgId);
  
  // Use EMPTY_ARRAY as initial state to avoid new reference on every render
  const [localAnswers, setLocalAnswers] = useState(EMPTY_ARRAY);
  const [expandedCategory, setExpandedCategory] = useState('infrastruktur');

  useEffect(() => {
    if (currentAnswers) {
      setLocalAnswers(currentAnswers);
    }
  }, [currentAnswers]);

  const handleToggle = (pointId, setFulfilled) => {
    setLocalAnswers(prev => {
      const exists = prev.find(a => a.point_id === pointId);
      if (exists) {
        return prev.map(a => a.point_id === pointId ? { ...a, is_fulfilled: setFulfilled } : a);
      } else {
        return [...prev, { point_id: pointId, is_fulfilled: setFulfilled }];
      }
    });
  };

  const handleSave = async () => {
    await updateChecklist({ 
      sppgId, 
      answers: localAnswers.map(a => ({ point_id: a.point_id, is_fulfilled: a.is_fulfilled })) 
    });
    if (onUpdate) onUpdate();
  };

  if (loadingAnswers) return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>;

  const categories = [
    { id: 'infrastruktur', label: 'Bangunan & Infrastruktur' },
    { id: 'peralatan', label: 'Peralatan' },
    { id: 'k3_lingkungan', label: 'K3 & Kesehatan Lingkungan' },
    { id: 'paket_mbg', label: 'Paket Program MBG' },
    { id: 'distribusi', label: 'Distribusi' },
    { id: 'dokumentasi', label: 'Dokumentasi & Monitoring' },
    { id: 'penerima_manfaat', label: 'Penerima Manfaat' },
    { id: 'tenaga_kerja', label: 'Tenaga Kerja' },
    { id: 'sertifikat_iso', label: 'Sertifikasi & ISO' },
    { id: 'administrasi', label: 'Administrasi' }
  ];

  return (
    <div className="space-y-4">
      {categories.map(cat => {
        const points = raportPoints.filter(p => p.category === cat.id);
        if (points.length === 0) return null;

        const isExpanded = expandedCategory === cat.id;

        // Calculate progress stats for this category
        const totalCount = points.length;
        const fulfilledCount = points.reduce((acc, point) => {
          const answer = localAnswers.find(a => a.point_id === point.id);
          return acc + (answer?.is_fulfilled ? 1 : 0);
        }, 0);

        return (
          <div key={cat.id} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50 shadow-sm transition-all duration-300">
            {/* Header Accordion Toggle */}
            <button
              type="button"
              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
              className={`w-full flex items-center justify-between px-6 py-4 text-left transition-all ${isExpanded ? 'bg-white border-b border-slate-100' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-700 tracking-wide uppercase">{cat.label}</span>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {fulfilledCount} / {totalCount}
                </span>
              </div>
              <div className="text-slate-400">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {/* Accordion Content */}
            {isExpanded && (
              <div className="p-6 bg-white space-y-3 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {points.map(point => {
                    const answer = localAnswers.find(a => a.point_id === point.id);
                    const isFulfilled = answer !== undefined ? answer.is_fulfilled : null;

                    return (
                      <div
                        key={point.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white transition-all gap-3"
                      >
                        <span className="text-[11px] font-bold text-slate-600 leading-relaxed">
                          {point.text}
                        </span>
                        
                        <div className="flex gap-2 shrink-0">
                          {/* Ya Button */}
                          <button
                            type="button"
                            onClick={() => handleToggle(point.id, true)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                              isFulfilled === true 
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <Check size={12} /> Ya
                          </button>
                          
                          {/* Tidak Button */}
                          <button
                            type="button"
                            onClick={() => handleToggle(point.id, false)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                              isFulfilled === false 
                                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <X size={12} /> Tidak
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-6">
        <button
          onClick={handleSave}
          disabled={isUpdatingChecklist}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
        >
          {isUpdatingChecklist ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
          Simpan Penilaian Raport
        </button>
      </div>
    </div>
  );
};

export default SPPGChecklist;
