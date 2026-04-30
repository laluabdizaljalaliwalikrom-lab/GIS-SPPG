import { useState } from 'react';
import { 
  Users, 
  Save, 
  X,
  School,
  Activity
} from 'lucide-react';

const KelompokForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        detail: initialData.detail || {
          porsi_kecil: 0,
          porsi_besar: 0,
          jumlah_guru: 0,
          jumlah_tendik: 0,
          jumlah_busui: 0,
          jumlah_bumil: 0,
          jumlah_balita_non_paud: 0,
          jumlah_kader: 0
        }
      };
    }
    return {
      nama: '',
      kode_kelompok: '',
      jenis_kelompok: 'School',
      jenis_kepemilikan: 'Negeri',
      alamat_lengkap: '',
      pj_nama: '',
      no_whatsapp: '',
      email: '',
      lat: -0.789275,
      lng: 113.921327,
      detail: {
        porsi_kecil: 0,
        porsi_besar: 0,
        activity: 0,
        jumlah_guru: 0,
        jumlah_tendik: 0,
        jumlah_busui: 0,
        jumlah_bumil: 0,
        jumlah_balita_non_paud: 0,
        jumlah_kader: 0
      }
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      detail: { ...prev.detail, [name]: parseInt(value) || 0 }
    }));
  };

  return (
    <div className="bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] p-6 lg:p-10 max-h-[90vh] overflow-y-auto w-full max-w-4xl scrollbar-hide">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Users size={24} />
           </div>
           <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                {initialData ? 'Edit Kelompok' : 'Tambah Kelompok'}
              </h2>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Kebutuhan Gizi Unit</p>
           </div>
        </div>
        <button onClick={onCancel} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
           <X size={20} />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
        {/* Section 1: Basic Info */}
        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-[2px] bg-blue-600" /> Profil Institusi
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Nama Lengkap</label>
                 <input 
                   type="text" name="nama" value={formData.nama} onChange={handleChange} required
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                   placeholder="Masukkan nama kelompok..."
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Kode Unik</label>
                 <input 
                   type="text" name="kode_kelompok" value={formData.kode_kelompok} onChange={handleChange} required
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm uppercase"
                   placeholder="K-000"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Tipe Kelompok</label>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setFormData(p => ({...p, jenis_kelompok: 'School'}))}
                      className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${formData.jenis_kelompok === 'School' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                    >
                       <School size={18} /> <span className="font-bold text-xs uppercase tracking-tight">Sekolah</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData(p => ({...p, jenis_kelompok: 'Posyandu'}))}
                      className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${formData.jenis_kelompok === 'Posyandu' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                    >
                       <Activity size={18} /> <span className="font-bold text-xs uppercase tracking-tight">Posyandu</span>
                    </button>
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Status Kepemilikan</label>
                 <select 
                   name="jenis_kepemilikan" value={formData.jenis_kepemilikan} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm appearance-none"
                 >
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                    <option value="Masyarakat">Masyarakat</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-8 h-[2px] bg-blue-600" /> Alamat & Kontak
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Nama P.J (Kontak)</label>
                 <input 
                   type="text" name="pj_nama" value={formData.pj_nama} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">WhatsApp / HP</label>
                 <input 
                   type="text" name="no_whatsapp" value={formData.no_whatsapp} onChange={handleChange}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                 />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Alamat Domisili</label>
                 <textarea 
                   name="alamat_lengkap" value={formData.alamat_lengkap} onChange={handleChange} rows={2}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm resize-none"
                 />
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-700 ml-1 text-center block">Latitude</label>
                   <input 
                     type="number" step="any" name="lat" value={formData.lat} onChange={handleChange}
                     className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-mono text-xs text-center"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-700 ml-1 text-center block">Longitude</label>
                   <input 
                     type="number" step="any" name="lng" value={formData.lng} onChange={handleChange}
                     className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-mono text-xs text-center"
                   />
                </div>
              </div>
           </div>
        </div>

        {/* Section 3: Detail Target Gizi */}
        <div className="space-y-6">
           <div className="p-6 lg:p-8 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-200 relative overflow-hidden">
              <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest relative z-10 flex items-center gap-2">
                 <Activity size={18} /> Target Porsi Gizi
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative z-10">
                 {formData.jenis_kelompok === 'School' ? (
                   <>
                     <DetailField label="Porsi Kecil" name="porsi_kecil" value={formData.detail.porsi_kecil} onChange={handleDetailChange} />
                     <DetailField label="Porsi Besar" name="porsi_besar" value={formData.detail.porsi_besar} onChange={handleDetailChange} />
                     <DetailField label="Jumlah Guru" name="jumlah_guru" value={formData.detail.jumlah_guru} onChange={handleDetailChange} />
                     <DetailField label="Jumlah Tendik" name="jumlah_tendik" value={formData.detail.jumlah_tendik} onChange={handleDetailChange} />
                   </>
                 ) : (
                   <>
                     <DetailField label="Busui" name="jumlah_busui" value={formData.detail.jumlah_busui} onChange={handleDetailChange} />
                     <DetailField label="Bumil" name="jumlah_bumil" value={formData.detail.jumlah_bumil} onChange={handleDetailChange} />
                     <DetailField label="Balita" name="jumlah_balita_non_paud" value={formData.detail.jumlah_balita_non_paud} onChange={handleDetailChange} />
                     <DetailField label="Kader" name="jumlah_kader" value={formData.detail.jumlah_kader} onChange={handleDetailChange} />
                   </>
                 )}
              </div>
              
              {/* Decorative Circle */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
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
             Simpan Data Kelompok
           </button>
        </div>
      </form>
    </div>
  );
};

const DetailField = ({ label, name, value, onChange }) => (
  <div className="space-y-1.5">
     <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest text-center block">{label}</label>
     <input 
       type="number" name={name} value={value} onChange={onChange}
       className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:bg-white focus:text-blue-600 outline-none transition-all font-black text-white text-center shadow-inner"
     />
  </div>
);

export default KelompokForm;
