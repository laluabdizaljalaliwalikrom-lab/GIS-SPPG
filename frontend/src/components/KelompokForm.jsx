import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  School,
  Activity
} from 'lucide-react';

const detailSchema = z.object({
  porsi_kecil: z.number().default(0),
  porsi_besar: z.number().default(0),
  jumlah_guru: z.number().default(0),
  jumlah_tendik: z.number().default(0),
  jumlah_busui: z.number().default(0),
  jumlah_bumil: z.number().default(0),
  jumlah_balita_non_paud: z.number().default(0),
  jumlah_kader: z.number().default(0)
});

const kelompokSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  kode_kelompok: z.string().min(2, 'Kode minimal 2 karakter'),
  jenis_kelompok: z.enum(['School', 'Posyandu']),
  jenis_kepemilikan: z.enum(['Negeri', 'Swasta', 'Masyarakat']),
  alamat_lengkap: z.string().min(5, 'Alamat minimal 5 karakter'),
  pj_nama: z.string().min(3, 'Nama P.J minimal 3 karakter'),
  no_whatsapp: z.string().min(10, 'Nomor WA minimal 10 karakter'),
  email: z.string().email('Email tidak valid'),
  lat: z.number(),
  lng: z.number(),
  detail: detailSchema
});

const KelompokForm = ({ initialData, onSubmit, formId }) => {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(kelompokSchema),
    defaultValues: {
      nama: '',
      kode_kelompok: '',
      jenis_kelompok: 'School',
      jenis_kepemilikan: 'Negeri',
      alamat_lengkap: '',
      pj_nama: '',
      no_whatsapp: '',
      email: '',
      lat: initialData?.lat || -8.625,
      lng: initialData?.lng || 116.44,
      detail: {
        porsi_kecil: 0, porsi_besar: 0, jumlah_guru: 0, jumlah_tendik: 0,
        jumlah_busui: 0, jumlah_bumil: 0, jumlah_balita_non_paud: 0, jumlah_kader: 0
      },
      ...initialData
    }
  });

  const jenisKelompok = useWatch({ control, name: 'jenis_kelompok' });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Basic Info */}
      <div className="space-y-6">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-8 h-[2px] bg-blue-600" /> Profil Institusi
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Nama Lengkap</label>
               <input 
                 {...register('nama')}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.nama ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm`}
                 placeholder="Masukkan nama kelompok..."
               />
               {errors.nama && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.nama.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Kode Unik</label>
               <input 
                 {...register('kode_kelompok')}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.kode_kelompok ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm uppercase`}
                 placeholder="K-000"
               />
               {errors.kode_kelompok && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.kode_kelompok.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Tipe Kelompok</label>
               <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setValue('jenis_kelompok', 'School')}
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${jenisKelompok === 'School' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                  >
                     <School size={18} /> <span className="font-bold text-xs uppercase tracking-tight">Sekolah</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setValue('jenis_kelompok', 'Posyandu')}
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${jenisKelompok === 'Posyandu' ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                  >
                     <Activity size={18} /> <span className="font-bold text-xs uppercase tracking-tight">Posyandu</span>
                  </button>
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Status Kepemilikan</label>
               <select 
                 {...register('jenis_kepemilikan')}
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
                 {...register('pj_nama')}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.pj_nama ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm`}
               />
               {errors.pj_nama && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.pj_nama.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">WhatsApp / HP</label>
               <input 
                 {...register('no_whatsapp')}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.no_whatsapp ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm`}
               />
               {errors.no_whatsapp && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.no_whatsapp.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Email Resmi</label>
               <input 
                 {...register('email')}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm`}
                 placeholder="nama@institusi.com"
               />
               {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
            </div>
            <div className="md:col-span-2 space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Alamat Domisili</label>
               <textarea 
                 {...register('alamat_lengkap')}
                 rows={2}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.alamat_lengkap ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm resize-none`}
               />
               {errors.alamat_lengkap && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.alamat_lengkap.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1 text-center block">Latitude</label>
                 <input 
                   type="number" step="any"
                   {...register('lat', { valueAsNumber: true })}
                   className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-mono text-xs text-center"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1 text-center block">Longitude</label>
                 <input 
                   type="number" step="any"
                   {...register('lng', { valueAsNumber: true })}
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
               {jenisKelompok === 'School' ? (
                 <>
                   <DetailField label="Porsi Kecil" {...register('detail.porsi_kecil', { valueAsNumber: true })} />
                   <DetailField label="Porsi Besar" {...register('detail.porsi_besar', { valueAsNumber: true })} />
                   <DetailField label="Jumlah Guru" {...register('detail.jumlah_guru', { valueAsNumber: true })} />
                   <DetailField label="Jumlah Tendik" {...register('detail.jumlah_tendik', { valueAsNumber: true })} />
                 </>
               ) : (
                 <>
                   <DetailField label="Busui" {...register('detail.jumlah_busui', { valueAsNumber: true })} />
                   <DetailField label="Bumil" {...register('detail.jumlah_bumil', { valueAsNumber: true })} />
                   <DetailField label="Balita" {...register('detail.jumlah_balita_non_paud', { valueAsNumber: true })} />
                   <DetailField label="Kader" {...register('detail.jumlah_kader', { valueAsNumber: true })} />
                 </>
               )}
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
         </div>
      </div>
    </form>
  );
};

const DetailField = ({ label, ...props }) => (
  <div className="space-y-1.5">
     <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest text-center block">{label}</label>
     <input 
       type="number"
       {...props}
       className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:bg-white focus:text-blue-600 outline-none transition-all font-black text-white text-center shadow-inner"
     />
  </div>
);

export default KelompokForm;
