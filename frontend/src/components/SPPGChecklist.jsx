import { useState, useEffect } from 'react';
import { useSPPG } from '../hooks/useSPPG';
import { Check, X, Loader2 } from 'lucide-react';

const EMPTY_ARRAY = [];


const SPPGChecklist = ({ sppgId, onUpdate }) => {
  const { raportPoints, useChecklist, updateChecklist, isUpdatingChecklist } = useSPPG();
  const { data: currentAnswers, isLoading: loadingAnswers } = useChecklist(sppgId);
  
  // Use EMPTY_ARRAY as initial state to avoid new reference on every render
  const [localAnswers, setLocalAnswers] = useState(EMPTY_ARRAY);

  useEffect(() => {
    if (currentAnswers) {
      setLocalAnswers(currentAnswers);
    }
  }, [currentAnswers]);


  const handleToggle = (pointId) => {
    setLocalAnswers(prev => {
      const exists = prev.find(a => a.point_id === pointId);
      if (exists) {
        return prev.map(a => a.point_id === pointId ? { ...a, is_fulfilled: !a.is_fulfilled } : a);
      } else {
        return [...prev, { point_id: pointId, is_fulfilled: true }];
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
    <div className="space-y-8">
      {categories.map(cat => {
        const points = raportPoints.filter(p => p.category === cat.id);
        if (points.length === 0) return null;

        return (
          <div key={cat.id} className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{cat.label}</h4>
            <div className="grid grid-cols-1 gap-3">
              {points.map(point => {
                const answer = localAnswers.find(a => a.point_id === point.id);
                const isFulfilled = answer?.is_fulfilled || false;

                return (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => handleToggle(point.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                      isFulfilled 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isFulfilled ? 'text-blue-700' : 'text-slate-600'}`}>
                      {point.text}
                    </span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isFulfilled ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300'
                    }`}>
                      {isFulfilled ? <Check size={14} /> : <X size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="pt-4">
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
