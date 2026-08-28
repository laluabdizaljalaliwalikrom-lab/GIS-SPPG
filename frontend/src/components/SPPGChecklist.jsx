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
          <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all">
            {/* Header Accordion Toggle */}
            <button
              type="button"
              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${isExpanded ? 'bg-slate-50/80 border-b border-slate-200' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-800 tracking-tight">{cat.label}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  {fulfilledCount} / {totalCount}
                </span>
              </div>
              <div className="text-slate-400">
                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </div>
            </button>

            {/* Accordion Content */}
            {isExpanded && (
              <div className="p-4 bg-white space-y-2 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  {points.map(point => {
                    const answer = localAnswers.find(a => a.point_id === point.id);
                    const isFulfilled = answer !== undefined ? answer.is_fulfilled : null;

                    return (
                      <div
                        key={point.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-200 bg-white gap-2.5"
                      >
                        <span className="text-xs font-medium text-slate-700 leading-relaxed">
                          {point.text}
                        </span>
                        
                        <div className="flex gap-1.5 shrink-0">
                          {/* Ya Button */}
                          <button
                            type="button"
                            onClick={() => handleToggle(point.id, true)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 border ${
                              isFulfilled === true 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <Check size={12} /> Ya
                          </button>
                          
                          {/* Tidak Button */}
                          <button
                            type="button"
                            onClick={() => handleToggle(point.id, false)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 border ${
                              isFulfilled === false 
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
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

      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={isUpdatingChecklist}
          className="btn-primary w-full text-xs"
        >
          {isUpdatingChecklist ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
          Simpan Penilaian Raport
        </button>
      </div>
    </div>
  );
};

export default SPPGChecklist;

