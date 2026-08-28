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
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Basic Info */}
      <div className="space-y-4">
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profil Kelompok</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Nama Lengkap Kelompok / Sekolah *</label>
               <input 
                 {...register('nama')}
                 className={`input ${errors.nama ? 'border-red-500' : ''}`}
                 placeholder="Contoh: SDN 1 Sikur"
               />
               {errors.nama && <p className="text-xs text-red-500 font-medium">{errors.nama.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Kode Unik *</label>
               <input 
                 {...register('kode_kelompok')}
                 className={`input uppercase ${errors.kode_kelompok ? 'border-red-500' : ''}`}
                 placeholder="SCH-001 / POS-001"
               />
               {errors.kode_kelompok && <p className="text-xs text-red-500 font-medium">{errors.kode_kelompok.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Jenis Institusi</label>
               <select 
                 {...register('jenis_kelompok')}
                 className="input"
               >
                  <option value="School">Sekolah (School)</option>
                  <option value="Posyandu">Posyandu</option>
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Status Kepemilikan</label>
               <select 
                 {...register('jenis_kepemilikan')}
                 className="input"
               >
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                  <option value="Masyarakat">Masyarakat</option>
               </select>
            </div>
         </div>
      </div>

      {/* Section 2: Detail Porsi & Sasaran */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {jenisKelompok === 'School' ? 'Rincian Sasaran Sekolah' : 'Rincian Sasaran Posyandu'}
         </h4>
         
         {jenisKelompok === 'School' ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-600">Porsi Kecil (1-3)</label>
                 <input 
                   type="number"
                   {...register('detail.porsi_kecil', { valueAsNumber: true })}
                   className="input"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-600">Porsi Besar (4-6)</label>
                 <input 
                   type="number"
                   {...register('detail.porsi_besar', { valueAsNumber: true })}
                   className="input"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-600">Jumlah Guru</label>
                 <input 
                   type="number"
                   {...register('detail.jumlah_guru', { valueAsNumber: true })}
                   className="input"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-600">Jumlah Tendik</label>
                 <input 
                   type="number"
                   {...register('detail.jumlah_tendik', { valueAsNumber: true })}
                   className="input"
                 />
              </div>
           </div>
         ) : (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-600">Ibu Menyusui</label>
                 <input 
                   type="number"
                   {...register('detail.jumlah_busui', { valueAsNumber: true })}
                   className="input"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-600">Ibu Hamil</label>
                 <input 
                   type="number"
                   {...register('detail.jumlah_bumil', { valueAsNumber: true })}
                   className="input"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-600">Balita Non-PAUD</label>
                 <input 
                   type="number"
                   {...register('detail.jumlah_balita_non_paud', { valueAsNumber: true })}
                   className="input"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-600">Kader Posyandu</label>
                 <input 
                   type="number"
                   {...register('detail.jumlah_kader', { valueAsNumber: true })}
                   className="input"
                 />
              </div>
           </div>
         )}
      </div>

      {/* Section 3: Kontak & PIC */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontak Penanggung Jawab</h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Nama P.J / Kepala *</label>
               <input 
                 {...register('pj_nama')}
                 className={`input ${errors.pj_nama ? 'border-red-500' : ''}`}
                 placeholder="Nama penanggung jawab"
               />
               {errors.pj_nama && <p className="text-xs text-red-500 font-medium">{errors.pj_nama.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Nomor WhatsApp *</label>
               <input 
                 {...register('no_whatsapp')}
                 className={`input ${errors.no_whatsapp ? 'border-red-500' : ''}`}
                 placeholder="08123456789"
               />
               {errors.no_whatsapp && <p className="text-xs text-red-500 font-medium">{errors.no_whatsapp.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Email Resmi *</label>
               <input 
                 {...register('email')}
                 className={`input ${errors.email ? 'border-red-500' : ''}`}
                 placeholder="institusi@domain.com"
               />
               {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>
         </div>
      </div>

      {/* Section 4: Geografis */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lokasi Koordinat</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Alamat Lengkap *</label>
               <textarea 
                 {...register('alamat_lengkap')}
                 rows={2}
                 className={`input resize-none ${errors.alamat_lengkap ? 'border-red-500' : ''}`}
                 placeholder="Alamat jalan / Desa..."
               />
               {errors.alamat_lengkap && <p className="text-xs text-red-500 font-medium">{errors.alamat_lengkap.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Latitude</label>
               <input 
                 type="number" step="any"
                 {...register('lat', { valueAsNumber: true })}
                 className="input font-mono text-xs"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Longitude</label>
               <input 
                 type="number" step="any"
                 {...register('lng', { valueAsNumber: true })}
                 className="input font-mono text-xs"
               />
            </div>
         </div>
      </div>
    </form>
  );
};

export default KelompokForm;

