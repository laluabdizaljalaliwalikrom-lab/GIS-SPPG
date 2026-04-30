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
  Save,
  Activity
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
    <div className="bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] p-6 lg:p-10 max-h-[90vh] overflow-y-auto w-full max-w-4xl scrollbar-hide">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Building2 size={24} />
           </div>
           <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                {initialData ? 'Edit Unit SPPG' : 'Tambah Unit SPPG'}
              </h2>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Operasional Satuan Gizi</p>
           </div>
        </div>
        <button onClick={onCancel} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
           <X size={20} />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
        {/* Section 1: Basic Identitas */}
        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-[2px] bg-blue-600" /> Identitas Unit
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Nama Unit Gizi</label>
                 <input 
                   type="text" name="nama" value={formData.nama} onChange={handleChange} required
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                   placeholder="Contoh: SPPG Unit A"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Kode Unik SPPG</label>
                 <input 
                   type="text" name="kode_sppg" value={formData.kode_sppg} onChange={handleChange} required
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm uppercase"
                   placeholder="SPPG-001"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1 text-blue-600">Kapasitas Produksi (Porti/Hari)</label>
                 <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600/50" size={18} />
                    <input 
                      type="number" name="kapasitas_produksi" value={formData.kapasitas_produksi} onChange={handleChange} required
                      className="w-full pl-12 pr-4 py-4 bg-blue-50/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-black text-blue-700"
                    />
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Status Operasi</label>
                 <select 
                   name="status_operasional" value={formData.status_operasional} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm appearance-none"
                 >
                    <option value="Aktif">Aktif</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Section 2: Personel */}
        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-[2px] bg-blue-600" /> Manajemen & Pengawas
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Nama Kepala Unit</label>
                 <input 
                   type="text" name="nama_kepala" value={formData.nama_kepala} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Pengawas Gizi</label>
                 <input 
                   type="text" name="pengawas_gizi" value={formData.pengawas_gizi} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Pengawas Keuangan</label>
                 <input 
                   type="text" name="pengawas_keuangan" value={formData.pengawas_keuangan} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Institusi / Yayasan</label>
                 <input 
                   type="text" name="nama_yayasan" value={formData.nama_yayasan} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                 />
              </div>
           </div>
        </div>

        {/* Section 3: Geografis */}
        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-[2px] bg-blue-600" /> Lokasi Geografis
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Alamat Lengkap</label>
                 <textarea 
                   name="alamat_desa" value={formData.alamat_desa} onChange={handleChange} rows={2}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm resize-none"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Latitude</label>
                 <input 
                   type="number" step="any" name="lat" value={formData.lat} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-mono text-xs"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Longitude</label>
                 <input 
                   type="number" step="any" name="lng" value={formData.lng} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-mono text-xs"
                 />
              </div>
           </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-4 pt-4">
           <button 
             type="button" onClick={onCancel}
             className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
           >
             Batalkan
           </button>
           <button 
             type="submit"
             className="flex-[2] px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95"
           >
             <Save size={18} />
             Simpan Unit SPPG
           </button>
        </div>
      </form>
    </div>
  );
};

export default SPPGUnitForm;
