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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Manajemen Unit SPPG</h1>
           <p className="text-slate-500 font-medium text-sm lg:text-base">Kelola data pusat produksi gizi (SPPG).</p>
        </div>
        
        <div className="flex gap-2">
           <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari unit..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all text-sm"
              />
           </div>
           
           {canManage && (
             <div className="flex gap-2">
                <ExcelImportButton 
                  endpoint="/api/sppg/import" 
                  onSuccess={() => window.location.reload()} 
                  title="Import Unit SPPG"
                />
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 text-xs"
                >
                   <Plus size={16} /> Tambah Unit
                </button>
             </div>
           )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Unit</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kapasitas</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full" /></td>
                  </tr>
                ))
              ) : sppgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Building2 size={32} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data tidak ditemukan</p>
                  </td>
                </tr>
              ) : sppgs.map((sppg) => (
                <tr 
                  key={sppg.id} 
                  onClick={() => handleRowClick(sppg)}
                  className="border-b border-slate-50 hover:bg-blue-50/30 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Building2 size={20} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-800 text-sm">{sppg.nama}</p>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{sppg.kode_sppg}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <MapPin size={12} className="text-slate-400" />
                          {sppg.alamat_desa}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          <User size={12} className="text-slate-300" />
                          {sppg.nama_kepala}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <Package size={16} className="text-slate-400" />
                       <span className="font-black text-slate-700 text-sm">{sppg.kapasitas_produksi.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border ${
                      sppg.status_operasional === 'Aktif' 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}>
                      {sppg.status_operasional}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end">
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
        onClose={() => setIsCreateModalOpen(false)}
        title="Tambah Unit SPPG Baru"
        isLoading={isCreating}
        onSubmit={() => document.getElementById('sppg-form').requestSubmit()}
        submitLabel="Simpan Unit"
      >
        <SPPGUnitForm 
          formId="sppg-form"
          onSubmit={handleCreate} 
        />
      </FormModal>

      {/* Detail & Edit Drawer */}
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
