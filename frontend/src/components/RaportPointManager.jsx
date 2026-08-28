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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Manajemen Poin Raport</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Kustomisasi kriteria checklist penilaian unit SPPG.</p>
        </div>
      </div>

      {/* Add New Point */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Kategori</label>
            <select 
              value={newPoint.category}
              onChange={(e) => setNewPoint({ ...newPoint, category: e.target.value })}
              className="input"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Deskripsi Poin Penilaian</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newPoint.text}
                onChange={(e) => setNewPoint({ ...newPoint, text: e.target.value })}
                placeholder="Contoh: Ketersediaan air bersih yang memadai..."
                className="input flex-1"
              />
              <button 
                onClick={handleAdd}
                disabled={loading || !newPoint.text.trim()}
                className="btn-primary shrink-0"
              >
                <Plus size={16} />
                <span>Tambah</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Points by Category */}
      <div className="space-y-4">
        {categories.map(cat => {
          const points = raportPoints.filter(p => p.category === cat.id);
          const Icon = cat.icon;

          return (
            <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${cat.bg} ${cat.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="font-semibold text-slate-800 text-xs">{cat.label}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {points.length} Poin
                </span>
              </div>

              <div className="p-3 divide-y divide-slate-100">
                {points.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center italic">Belum ada poin kriteria pada kategori ini.</p>
                ) : (
                  points.map(p => (
                    <div key={p.id} className="py-2.5 px-2 flex items-center justify-between gap-3 group hover:bg-slate-50 rounded-lg transition-colors">
                      <span className="text-xs text-slate-700 font-medium">{p.text}</span>
                      <button
                        onClick={() => deletePoint(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all shrink-0"
                        title="Hapus Kriteria"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RaportPointManager;
