import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Package } from 'lucide-react';

const sppgSchema = z.object({
  nama: z.string().min(3, 'Nama unit minimal 3 karakter'),
  kode_sppg: z.string().min(2, 'Kode unit minimal 2 karakter'),
  alamat_desa: z.string().min(5, 'Alamat minimal 5 karakter'),
  status_operasional: z.enum(['Aktif', 'Maintenance', 'Non-Aktif']),
  tanggal_operasional: z.string(),
  nama_kepala: z.string().min(3, 'Nama kepala minimal 3 karakter'),
  pengawas_keuangan: z.string().optional().nullable(),
  pengawas_gizi: z.string().optional().nullable(),
  pic_yayasan: z.string().optional().nullable(),
  nama_yayasan: z.string().optional().nullable(),
  kapasitas_produksi: z.number().min(1, 'Kapasitas minimal 1'),
  lat: z.number(),
  lng: z.number(),
  infrastruktur_score: z.number().min(0).max(100).optional().default(0),
  sdm_score: z.number().min(0).max(100).optional().default(0),
  kepuasan_score: z.number().min(0).max(100).optional().default(0)
});

const SPPGUnitForm = ({ initialData, onSubmit, formId }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(sppgSchema),
    defaultValues: initialData || {
      nama: '',
      kode_sppg: '',
      alamat_desa: '',
      status_operasional: 'Aktif',
      tanggal_operasional: new Date().toISOString().split('T')[0],
      nama_kepala: '',
      pengawas_gizi: '',
      pengawas_keuangan: '',
      nama_yayasan: '',
      pic_yayasan: '',
      kapasitas_produksi: 1000,
      lat: -8.625,
      lng: 116.44,
      infrastruktur_score: 0,
      sdm_score: 0,
      kepuasan_score: 0
    }
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Basic Identitas */}
      <div className="space-y-6">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-8 h-[2px] bg-blue-600" /> Identitas Unit
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Nama Unit Gizi</label>
               <input 
                 {...register('nama')}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.nama ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm`}
                 placeholder="Contoh: SPPG Unit A"
               />
               {errors.nama && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.nama.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Kode Unik SPPG</label>
               <input 
                 {...register('kode_sppg')}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.kode_sppg ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm uppercase`}
                 placeholder="SPPG-001"
               />
               {errors.kode_sppg && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.kode_sppg.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1 text-blue-600">Kapasitas Produksi (Porti/Hari)</label>
               <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600/50" size={18} />
                  <input 
                    type="number" 
                    {...register('kapasitas_produksi', { valueAsNumber: true })}
                    className={`w-full pl-12 pr-4 py-4 bg-blue-50/50 border ${errors.kapasitas_produksi ? 'border-red-500' : 'border-blue-100'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-black text-blue-700`}
                  />
               </div>
               {errors.kapasitas_produksi && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.kapasitas_produksi.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Status Operasi</label>
               <select 
                 {...register('status_operasional')}
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
                 {...register('nama_kepala')}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.nama_kepala ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm`}
               />
               {errors.nama_kepala && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.nama_kepala.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Pengawas Gizi</label>
               <input 
                 {...register('pengawas_gizi')}
                 className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Pengawas Keuangan</label>
               <input 
                 {...register('pengawas_keuangan')}
                 className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Institusi / Yayasan</label>
               <input 
                 {...register('nama_yayasan')}
                 className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                 placeholder="Nama Yayasan"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">P.I.C Yayasan</label>
               <input 
                 {...register('pic_yayasan')}
                 className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                 placeholder="Nama PIC"
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
                 {...register('alamat_desa')}
                 rows={2}
                 className={`w-full px-4 py-4 bg-slate-50 border ${errors.alamat_desa ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm resize-none`}
               />
               {errors.alamat_desa && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.alamat_desa.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Latitude</label>
               <input 
                 type="number" step="any"
                 {...register('lat', { valueAsNumber: true })}
                 className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-mono text-xs"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Longitude</label>
               <input 
                 type="number" step="any"
                 {...register('lng', { valueAsNumber: true })}
                 className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-mono text-xs"
               />
            </div>
         </div>
      </div>
      
      {/* Section 4: Raport Kinerja */}
      <div className="space-y-6">
         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-8 h-[2px] bg-blue-600" /> Penilaian Raport SPPG (0-100)
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Infrastruktur</label>
               <input 
                 type="number"
                 {...register('infrastruktur_score', { valueAsNumber: true })}
                 className="w-full px-4 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all font-black text-emerald-700"
               />
               {errors.infrastruktur_score && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.infrastruktur_score.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Manajemen SDM</label>
               <input 
                 type="number"
                 {...register('sdm_score', { valueAsNumber: true })}
                 className="w-full px-4 py-4 bg-blue-50/50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-black text-blue-700"
               />
               {errors.sdm_score && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.sdm_score.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 ml-1">Kepuasan</label>
               <input 
                 type="number"
                 {...register('kepuasan_score', { valueAsNumber: true })}
                 className="w-full px-4 py-4 bg-amber-50/50 border border-amber-100 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-600 outline-none transition-all font-black text-amber-700"
               />
               {errors.kepuasan_score && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.kepuasan_score.message}</p>}
            </div>
         </div>
      </div>
    </form>
  );
};

export default SPPGUnitForm;
