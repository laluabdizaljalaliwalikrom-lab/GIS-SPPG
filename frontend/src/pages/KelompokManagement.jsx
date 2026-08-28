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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-header">Kelompok Penerima</h1>
          <p className="page-subtitle">Kelola dan verifikasi data penerima gizi.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Cari kelompok..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all text-sm"
            />
          </div>
          {canManage && (
            <div className="flex gap-2">
              <ExcelImportButton endpoint="/api/kelompok/import" onSuccess={() => window.location.reload()} title="Import Kelompok" type="kelompok" />
              <button onClick={() => setIsCreateModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm shadow-sm">
                <Plus size={15} /> Tambah Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 no-scrollbar">
        {['all', 'pending_verification', 'verified', 'rejected'].map(status => (
          <button key={status} onClick={() => setStatusFilter(status)}
            className={`chip ${statusFilter === status ? 'chip-active' : 'chip-inactive'}`}>
            {status === 'all' ? 'Semua' :
             status === 'pending_verification' ? 'Menunggu' :
             status === 'verified' ? 'Terverifikasi' : 'Ditolak'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="table-header">Identitas Kelompok</th>
                <th className="table-header hidden md:table-cell">Jenis</th>
                <th className="table-header hidden lg:table-cell">Lokasi</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-4 py-5"><div className="h-3 bg-slate-100 rounded w-full" /></td>
                  </tr>
                ))
              ) : kelompoks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="empty-state"><Users size={22} className="text-slate-300" /></div>
                    <p className="empty-text">Data tidak ditemukan</p>
                  </td>
                </tr>
              ) : kelompoks.map((k) => (
                <tr key={k.id} onClick={() => handleRowClick(k)} className="table-row group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="icon-box group-hover:bg-blue-50">
                        <Users size={17} className="text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{k.nama}</p>
                        <p className="text-xs text-blue-600 font-medium">{k.kode_kelompok}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-blue-400" />{k.jenis_kelompok}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Globe size={12} className="text-slate-300" />{k.jenis_kepemilikan}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex items-start gap-1.5 max-w-xs">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-600 line-clamp-1">{k.alamat_lengkap}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={k.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {canVerify && k.status === 'pending_verification' && (
                        <div className="flex gap-1">
                          <button onClick={(e) => handleVerify(e, k.id, 'verified')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-all" title="Verifikasi">
                            <Check size={14} />
                          </button>
                          <button onClick={(e) => handleVerify(e, k.id, 'rejected')}
                            className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-all" title="Tolak">
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canManage && (
        <button onClick={() => setIsCreateModalOpen(true)} className="fab">
          <Plus size={22} />
        </button>
      )}

      <FormModal isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setInitialCoords(null); }}
        title="Tambah Kelompok Baru" isLoading={isCreating}
        onSubmit={() => document.getElementById('kelompok-form').requestSubmit()}
        submitLabel="Simpan Data"
      >
        <KelompokForm formId="kelompok-form"
          initialData={initialCoords ? { lat: initialCoords.lat, lng: initialCoords.lng } : null}
          onSubmit={handleCreate} />
      </FormModal>

      <EntityDetailDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}
        entity={selectedEntity} type="kelompok" profile={profile} />
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const cls = {
    pending_verification: 'badge-pending',
    verified: 'badge-verified',
    rejected: 'badge-rejected'
  };
  const labels = {
    pending_verification: 'Menunggu',
    verified: 'Terverifikasi',
    rejected: 'Ditolak'
  };
  return (
    <span className={cls[status] || 'badge bg-slate-50 text-slate-400 border-slate-200'}>
      {labels[status] || 'Unknown'}
    </span>
  );
};

export default KelompokManagement;
