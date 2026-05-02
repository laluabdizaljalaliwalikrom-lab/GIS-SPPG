import { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import KelompokForm from '../components/KelompokForm';
import FormModal from '../components/FormModal';
import EntityDetailDrawer from '../components/EntityDetailDrawer';
import { useKelompok } from '../hooks/useKelompok';
import ExcelImportButton from '../components/ExcelImportButton';
import { 
// ... existing imports ...
  Users, 
  XCircle, 
  Search, 
  MapPin,
  Plus,
  Check,
  ChevronRight,
  ShieldCheck,
  Globe
} from 'lucide-react';

const KelompokManagement = () => {
  const { profile } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Extract URL params directly for initialization
  const urlAdd = searchParams.get('add') === 'true';
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');

  // Initialize state directly from URL params to avoid cascading renders
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(urlAdd);
  const [initialCoords, setInitialCoords] = useState(
    (urlAdd && urlLat && urlLng) 
      ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) } 
      : null
  );

  useEffect(() => {
    // Only use the effect for cleaning up the URL parameters
    if (searchParams.get('add')) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    kelompoks,
    isLoading,
    createKelompok,
    verifyKelompok,
    isCreating
  } = useKelompok({ 
    name: searchTerm, 
    status: statusFilter === 'all' ? undefined : statusFilter 
  });


  const handleCreate = async (formData) => {
    try {
      await createKelompok(formData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRowClick = (kelompok) => {
    setSelectedEntity(kelompok);
    setIsDrawerOpen(true);
  };

  const handleVerify = async (e, id, status) => {
    e.stopPropagation(); // Prevent opening drawer
    await verifyKelompok({ id, status });
  };

  const canManage = profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator';
  const canVerify = profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Kelompok Penerima</h1>
           <p className="text-slate-500 font-medium text-sm lg:text-base">Kelola dan verifikasi data penerima gizi.</p>
        </div>
        
        <div className="flex gap-2">
           <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari kelompok..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all text-sm"
              />
           </div>
           
           {canManage && (
             <div className="flex gap-2">
                <ExcelImportButton 
                  endpoint="/api/kelompok/import" 
                  onSuccess={() => window.location.reload()} 
                  title="Import Kelompok Penerima"
                  type="kelompok"
                />
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 text-xs"
                >
                   <Plus size={16} /> Tambah Data
                </button>
             </div>
           )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar">
         {['all', 'pending_verification', 'verified', 'rejected'].map(status => (
           <button
             key={status}
             onClick={() => setStatusFilter(status)}
             className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
               statusFilter === status 
                 ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                 : "bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:text-blue-600"
             }`}
           >
             {status === 'all' ? 'Semua Status' : status.replace('_', ' ').toUpperCase()}
           </button>
         ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Kelompok</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis & Kepemilikan</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Verifikasi</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full" /></td>
                  </tr>
                ))
              ) : kelompoks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Users size={32} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data tidak ditemukan</p>
                  </td>
                </tr>
              ) : kelompoks.map((k) => (
                <tr 
                  key={k.id} 
                  onClick={() => handleRowClick(k)}
                  className="border-b border-slate-50 hover:bg-blue-50/30 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Users size={20} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-800 text-sm">{k.nama}</p>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{k.kode_kelompok}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                          <ShieldCheck size={12} className="text-blue-400" />
                          {k.jenis_kelompok}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          <Globe size={12} className="text-slate-300" />
                          {k.jenis_kepemilikan}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-2 max-w-xs">
                       <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                       <span className="text-xs text-slate-600 font-medium line-clamp-1">{k.alamat_lengkap}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={k.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end items-center gap-2">
                       {canVerify && k.status === 'pending_verification' && (
                         <div className="flex gap-1 mr-2">
                           <button 
                             onClick={(e) => handleVerify(e, k.id, 'verified')} 
                             className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                             title="Verifikasi"
                           >
                              <Check size={14} />
                           </button>
                           <button 
                             onClick={(e) => handleVerify(e, k.id, 'rejected')} 
                             className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                             title="Tolak"
                           >
                              <XCircle size={14} />
                           </button>
                         </div>
                       )}
                       <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <ChevronRight size={18} />
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAB (Mobile Only) */}
      {canManage && (
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-400 flex items-center justify-center active:scale-90 transition-transform z-50 ring-4 ring-white"
        >
           <Plus size={28} />
        </button>
      )}

      {/* Create Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialCoords(null);
        }}
        title="Tambah Kelompok Baru"
        isLoading={isCreating}
        onSubmit={() => document.getElementById('kelompok-form').requestSubmit()}
        submitLabel="Simpan Data"
      >
        <KelompokForm 
          formId="kelompok-form"
          initialData={initialCoords ? { lat: initialCoords.lat, lng: initialCoords.lng } : null}
          onSubmit={handleCreate} 
        />
      </FormModal>

      {/* Detail & Edit Drawer */}
      <EntityDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        entity={selectedEntity}
        type="kelompok"
        profile={profile}
      />
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending_verification: 'bg-amber-50 text-amber-600 border-amber-100',
    verified: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-600 border-red-100'
  };
  const labels = {
    pending_verification: 'MENUNGGU VERIFIKASI',
    verified: 'TERVERIFIKASI',
    rejected: 'DITOLAK'
  };
  
  return (
    <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${styles[status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
       {labels[status] || 'UNKNOWN'}
    </span>
  );
};

export default KelompokManagement;
