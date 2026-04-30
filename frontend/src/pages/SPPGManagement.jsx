import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useOutletContext } from 'react-router-dom';
import SPPGUnitForm from '../components/SPPGUnitForm';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  User, 
  Package,
  ArrowRight
} from 'lucide-react';

const SPPGManagement = () => {
  const { profile } = useOutletContext();
  const [sppgs, setSppgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/sppg');
      setSppgs(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  const handleSave = async (formData) => {
    try {
      if (editingItem) {
        await api.put(`/sppg/${editingItem.id}`, formData);
      } else {
        await api.post('/sppg', formData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error saving unit');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus unit ini?')) return;
    try {
      await api.delete(`/sppg/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error deleting unit');
    }
  };

  const filteredData = sppgs.filter(s => 
    s.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.kode_sppg?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = profile?.role === 'admin' || profile?.role === 'sppg_head';

  return (
    <div className="space-y-6 lg:pb-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Daftar Unit SPPG</h1>
           <p className="text-slate-500 font-medium text-sm lg:text-base">Manajemen Satuan Pelayanan Pemenuhan Gizi.</p>
        </div>
        
        <div className="flex gap-2">
           <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari unit..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
              />
           </div>
           
           {canManage && (
             <button 
               onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
               className="hidden lg:flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
             >
                <Plus size={18} /> Tambah Unit
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredData.map((s) => (
          <div key={s.id} className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-200/30 transition-all group relative overflow-hidden flex flex-col">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Building2 size={24} className="lg:hidden" />
                      <Building2 size={28} className="hidden lg:block" />
                   </div>
                   <div className="min-w-0">
                      <h3 className="text-lg lg:text-xl font-black text-slate-800 truncate">{s.nama}</h3>
                      <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">{s.kode_sppg}</p>
                   </div>
                </div>
                <div className="flex gap-1">
                   {canManage && (
                     <>
                        <button onClick={() => handleEdit(s)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                           <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                           <Trash2 size={16} />
                        </button>
                     </>
                   )}
                </div>
             </div>

             <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kepala Unit</p>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs truncate">
                        <User size={12} className="text-blue-400" />
                        {s.nama_kepala}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kapasitas</p>
                    <div className="flex items-center gap-2 justify-end text-slate-700 font-bold text-xs">
                        <Package size={12} className="text-blue-400" />
                        {s.kapasitas_produksi?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lokasi</p>
                   <div className="flex items-start gap-2 text-slate-600 font-medium text-[11px] leading-relaxed">
                      <MapPin size={12} className="text-blue-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{s.alamat_desa}</span>
                   </div>
                </div>
             </div>

             <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter ${s.status_operasional === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {s.status_operasional}
                </span>
                <button className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                   <ArrowRight size={16} />
                </button>
             </div>
             
             {/* Gradient Accent */}
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-blue-100/50 transition-colors" />
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
         <div className="p-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 size={40} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">Tidak ada unit SPPG ditemukan.</p>
            <p className="text-xs text-slate-300 mt-1">Coba gunakan kata kunci lain.</p>
         </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      {canManage && (
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-400 flex items-center justify-center active:scale-90 transition-transform z-50 ring-4 ring-white"
        >
           <Plus size={28} />
        </button>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative w-full lg:max-w-4xl bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] p-6 lg:p-0 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 lg:slide-in-from-bottom-4 duration-300">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 lg:hidden" />
              <SPPGUnitForm 
                initialData={editingItem} 
                onSave={handleSave} 
                onCancel={() => setIsModalOpen(false)} 
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default SPPGManagement;
