import { useState } from 'react';
import { useSPPG } from '../hooks/useSPPG';
import { Plus, Trash2, Home, ChefHat, ShieldCheck, Heart, Truck, FileText, Users, UserCheck, Award, Briefcase } from 'lucide-react';

const RaportPointManager = () => {
  const { raportPoints, createPoint, deletePoint, loadingPoints } = useSPPG();
  const [newPoint, setNewPoint] = useState({ category: 'infrastruktur', text: '' });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newPoint.text.trim()) return;
    setLoading(true);
    try {
      await createPoint(newPoint);
      setNewPoint({ ...newPoint, text: '' });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'infrastruktur', label: 'Bangunan & Infrastruktur', icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'peralatan', label: 'Peralatan', icon: ChefHat, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'k3_lingkungan', label: 'K3 & Kesehatan Lingkungan', icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'paket_mbg', label: 'Paket Program MBG', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'distribusi', label: 'Distribusi', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'dokumentasi', label: 'Dokumentasi & Monitoring', icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'penerima_manfaat', label: 'Penerima Manfaat', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'tenaga_kerja', label: 'Tenaga Kerja', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'sertifikat_iso', label: 'Sertifikasi & ISO', icon: Award, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'administrasi', label: 'Administrasi', icon: Briefcase, color: 'text-slate-600', bg: 'bg-slate-50' }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800">Manajemen Poin Raport</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Kustomisasi Kriteria Penilaian SPPG</p>
        </div>
      </div>

      {/* Add New Point */}
      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Kategori</label>
            <select 
              value={newPoint.category}
              onChange={(e) => setNewPoint({ ...newPoint, category: e.target.value })}
              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Deskripsi Poin Penilaian</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newPoint.text}
                onChange={(e) => setNewPoint({ ...newPoint, text: e.target.value })}
                placeholder="Contoh: Ketersediaan air bersih yang memadai..."
                className="flex-1 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
              />
              <button 
                onClick={handleAdd}
                disabled={loading || !newPoint.text.trim()}
                className="px-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* List of Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map(cat => (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center gap-3 px-1 mb-4">
              <div className={`w-8 h-8 ${cat.bg} ${cat.color} rounded-xl flex items-center justify-center`}>
                <cat.icon size={18} />
              </div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{cat.label}</h4>
            </div>

            <div className="space-y-2">
              {raportPoints.filter(p => p.category === cat.id).length === 0 ? (
                <p className="text-[10px] text-slate-400 italic px-2">Belum ada poin kriteria.</p>
              ) : (
                raportPoints.filter(p => p.category === cat.id).map(point => (
                  <div 
                    key={point.id}
                    className="group flex items-start justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all animate-in fade-in"
                  >
                    <p className="text-xs font-bold text-slate-600 leading-relaxed pr-4">{point.text}</p>
                    <button 
                      onClick={() => deletePoint(point.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaportPointManager;
