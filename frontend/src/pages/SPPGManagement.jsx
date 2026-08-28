import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import FormModal from '../components/FormModal';
import SPPGUnitForm from '../components/SPPGUnitForm';
import EntityDetailDrawer from '../components/EntityDetailDrawer';
import { useSPPG } from '../hooks/useSPPG';
import ExcelImportButton from '../components/ExcelImportButton';
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  User, 
  Package,
  ChevronRight
} from 'lucide-react';

const SPPGManagement = () => {
  const { profile } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { 
    sppgs, 
    isLoading, 
    createSPPG, 
    isCreating
  } = useSPPG({ name: searchTerm });

  const handleCreate = async (formData) => {
    try {
      await createSPPG(formData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRowClick = (sppg) => {
    setSelectedEntity(sppg);
    setIsDrawerOpen(true);
  };

  const canManage = profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-header">Manajemen Unit SPPG</h1>
          <p className="page-subtitle">Kelola data pusat produksi gizi (SPPG).</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Cari unit..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all text-sm"
            />
          </div>
          {canManage && (
            <div className="flex gap-2">
              <ExcelImportButton endpoint="/api/sppg/import" onSuccess={() => window.location.reload()} title="Import Unit SPPG" />
              <button onClick={() => setIsCreateModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm shadow-sm">
                <Plus size={15} /> Tambah Unit
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="table-header">Identitas Unit</th>
                <th className="table-header">Lokasi</th>
                <th className="table-header hidden md:table-cell">Kapasitas</th>
                <th className="table-header">Status</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-4 py-5">
                      <div className="h-3 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : sppgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="empty-state"><Building2 size={22} className="text-slate-300" /></div>
                    <p className="empty-text">Data tidak ditemukan</p>
                  </td>
                </tr>
              ) : sppgs.map((sppg) => (
                <tr key={sppg.id} onClick={() => handleRowClick(sppg)} className="table-row group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="icon-box group-hover:bg-blue-50">
                        <Building2 size={17} className="text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{sppg.nama}</p>
                        <p className="text-xs text-blue-600 font-medium">{sppg.kode_sppg}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin size={12} className="text-slate-400 shrink-0" />{sppg.alamat_desa}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <User size={12} className="text-slate-300 shrink-0" />{sppg.nama_kepala}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Package size={14} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{sppg.kapasitas_produksi.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={sppg.status_operasional === 'Aktif' ? 'badge-aktif' : 'badge-nonaktif'}>
                      {sppg.status_operasional}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-blue-500 transition-colors" />
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

      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tambah Unit SPPG Baru"
        isLoading={isCreating}
        onSubmit={() => document.getElementById('sppg-form').requestSubmit()}
        submitLabel="Simpan Unit"
      >
        <SPPGUnitForm formId="sppg-form" onSubmit={handleCreate} />
      </FormModal>

      <EntityDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        entity={selectedEntity}
        type="sppg"
        profile={profile}
      />
    </div>
  );
};

export default SPPGManagement;
