import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  User, 
  Package, 
  Calendar,
  ShieldCheck,
  Zap,
  X,
  Save
} from 'lucide-react';

const SPPGUnitForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nama: '',
    kode_sppg: '',
    alamat_desa: '',
    status_operasional: 'Aktif',
    tanggal_operasional: new Date().toISOString().split('T')[0],
    nama_kepala: '',
    pengawas_keuangan: '',
    pengawas_gizi: '',
    pic_yayasan: '',
    nama_yayasan: '',
    kapasitas_produksi: 0,
    lat: -0.789275,
    lng: 113.921327
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        tanggal_operasional: initialData.tanggal_operasional || new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'kapasitas_produksi' ? parseInt(value) || 0 : value 
    }));
  };

  return (
    <div className="bg-white rounded-3xl p-8 max-h-[85vh] overflow-auto custom-scrollbar shadow-2xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Building2 size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {initialData ? 'Edit Unit SPPG' : 'Tambah Unit SPPG Baru'}
              </h2>
              <p className="text-sm text-slate-500">Kelola informasi operasional dan kapasitas produksi.</p>
           </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
           <X size={24} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
        {/* Section 1: Identitas Unit */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Identitas Unit
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Nama Unit</label>
                 <input 
                   type="text" name="nama" value={formData.nama} onChange={handleChange} required
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                   placeholder="SPPG Unit A"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Kode Unit</label>
                 <input 
                   type="text" name="kode_sppg" value={formData.kode_sppg} onChange={handleChange} required
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                   placeholder="SPPG-001"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Kapasitas Produksi (Porsi/Hari)</label>
                 <input 
                   type="number" name="kapasitas_produksi" value={formData.kapasitas_produksi} onChange={handleChange} required
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-emerald-700"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Status Operasional</label>
                 <select 
                   name="status_operasional" value={formData.status_operasional} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 >
                    <option value="Aktif">Aktif</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Section 2: Personel & Yayasan */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Personel & Manajemen
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Nama Kepala Unit</label>
                 <input 
                   type="text" name="nama_kepala" value={formData.nama_kepala} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Nama Yayasan</label>
                 <input 
                   type="text" name="nama_yayasan" value={formData.nama_yayasan} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Pengawas Gizi</label>
                 <input 
                   type="text" name="pengawas_gizi" value={formData.pengawas_gizi} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Pengawas Keuangan</label>
                 <input 
                   type="text" name="pengawas_keuangan" value={formData.pengawas_keuangan} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 />
              </div>
           </div>
        </div>

        {/* Section 3: Lokasi */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Lokasi Geografis
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Alamat Desa</label>
                 <textarea 
                   name="alamat_desa" value={formData.alamat_desa} onChange={handleChange} rows={2}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Latitude</label>
                 <input 
                   type="number" step="any" name="lat" value={formData.lat} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-sm"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Longitude</label>
                 <input 
                   type="number" step="any" name="lng" value={formData.lng} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-sm"
                 />
              </div>
           </div>
        </div>

        <div className="flex gap-4 pt-4">
           <button 
             type="button" onClick={onCancel}
             className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
           >
             Batal
           </button>
           <button 
             type="submit"
             className="flex-[2] px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
           >
             <Save size={20} />
             Simpan Unit SPPG
           </button>
        </div>
      </form>
    </div>
  );
};

export default SPPGUnitForm;
