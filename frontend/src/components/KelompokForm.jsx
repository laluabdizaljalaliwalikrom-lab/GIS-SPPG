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
    <div className="bg-white rounded-3xl p-8 max-h-[85vh] overflow-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {initialData ? 'Edit Kelompok' : 'Tambah Kelompok Baru'}
              </h2>
              <p className="text-sm text-slate-500">Lengkapi data profil dan detail kebutuhan gizi.</p>
           </div>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
           <X size={24} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
        {/* Section 1: Basic Info */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Informasi Dasar
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Nama Kelompok</label>
                 <input 
                   type="text" name="nama" value={formData.nama} onChange={handleChange} required
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                   placeholder="Contoh: SD Negeri 01 Jakarta"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Kode Kelompok</label>
                 <input 
                   type="text" name="kode_kelompok" value={formData.kode_kelompok} onChange={handleChange} required
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                   placeholder="K-001"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Jenis Kelompok</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData(p => ({...p, jenis_kelompok: 'School'}))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${formData.jenis_kelompok === 'School' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                    >
                       <School size={18} /> <span className="font-bold text-sm">Sekolah</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData(p => ({...p, jenis_kelompok: 'Posyandu'}))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${formData.jenis_kelompok === 'Posyandu' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                    >
                       <Activity size={18} /> <span className="font-bold text-sm">Posyandu</span>
                    </button>
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Kepemilikan</label>
                 <select 
                   name="jenis_kepemilikan" value={formData.jenis_kepemilikan} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 >
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                    <option value="Masyarakat">Masyarakat</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Kontak & Lokasi
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Penanggung Jawab</label>
                 <input 
                   type="text" name="pj_nama" value={formData.pj_nama} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">No. WhatsApp</label>
                 <input 
                   type="text" name="no_whatsapp" value={formData.no_whatsapp} onChange={handleChange}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                 />
              </div>
              <div className="md:col-span-2 space-y-1">
                 <label className="text-xs font-bold text-slate-500 ml-1">Alamat Lengkap</label>
                 <textarea 
                   name="alamat_lengkap" value={formData.alamat_lengkap} onChange={handleChange} rows={2}
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

        {/* Section 3: Detail Target Gizi */}
        <div className="space-y-4">
           <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 mb-6 flex items-center gap-2">
                 Target Sasaran Gizi (Porti)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
             Simpan Data Kelompok
           </button>
        </div>
      </form>
    </div>
  );
};

const DetailField = ({ label, name, value, onChange }) => (
  <div className="space-y-1.5">
     <label className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest">{label}</label>
     <input 
       type="number" name={name} value={value} onChange={onChange}
       className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-emerald-900"
     />
  </div>
);

export default KelompokForm;
