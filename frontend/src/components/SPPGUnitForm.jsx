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
  lng: z.number()
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
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Basic Identitas */}
      <div className="space-y-4">
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identitas Unit</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Nama Unit Gizi *</label>
               <input 
                 {...register('nama')}
                 className={`input ${errors.nama ? 'border-red-500' : ''}`}
                 placeholder="Contoh: SPPG Sikur Barat"
               />
               {errors.nama && <p className="text-xs text-red-500 font-medium">{errors.nama.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Kode Unik SPPG *</label>
               <input 
                 {...register('kode_sppg')}
                 className={`input uppercase ${errors.kode_sppg ? 'border-red-500' : ''}`}
                 placeholder="SPPG-001"
               />
               {errors.kode_sppg && <p className="text-xs text-red-500 font-medium">{errors.kode_sppg.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Kapasitas Produksi (Porsi/Hari) *</label>
               <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number" 
                    {...register('kapasitas_produksi', { valueAsNumber: true })}
                    className={`input pl-9 font-semibold ${errors.kapasitas_produksi ? 'border-red-500' : ''}`}
                  />
               </div>
               {errors.kapasitas_produksi && <p className="text-xs text-red-500 font-medium">{errors.kapasitas_produksi.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Status Operasi</label>
               <select 
                 {...register('status_operasional')}
                 className="input"
               >
                  <option value="Aktif">Aktif</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Non-Aktif">Non-Aktif</option>
               </select>
            </div>
         </div>
      </div>

      {/* Section 2: Personel */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manajemen & Pengawas</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Nama Kepala Unit *</label>
               <input 
                 {...register('nama_kepala')}
                 className={`input ${errors.nama_kepala ? 'border-red-500' : ''}`}
                 placeholder="Nama Kepala SPPG"
               />
               {errors.nama_kepala && <p className="text-xs text-red-500 font-medium">{errors.nama_kepala.message}</p>}
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Pengawas Gizi</label>
               <input 
                 {...register('pengawas_gizi')}
                 className="input"
                 placeholder="Nama Ahli Gizi"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Pengawas Keuangan</label>
               <input 
                 {...register('pengawas_keuangan')}
                 className="input"
                 placeholder="Nama Pengawas Keuangan"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Institusi / Yayasan</label>
               <input 
                 {...register('nama_yayasan')}
                 className="input"
                 placeholder="Nama Yayasan Penyelenggara"
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">P.I.C Yayasan</label>
               <input 
                 {...register('pic_yayasan')}
                 className="input"
                 placeholder="Nama Penanggung Jawab"
               />
            </div>
         </div>
      </div>

      {/* Section 3: Geografis */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lokasi Geografis</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Alamat Lengkap / Desa *</label>
               <textarea 
                 {...register('alamat_desa')}
                 rows={2}
                 className={`input resize-none ${errors.alamat_desa ? 'border-red-500' : ''}`}
                 placeholder="Alamat jalan / RT / RW / Desa..."
               />
               {errors.alamat_desa && <p className="text-xs text-red-500 font-medium">{errors.alamat_desa.message}</p>}
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

export default SPPGUnitForm;
