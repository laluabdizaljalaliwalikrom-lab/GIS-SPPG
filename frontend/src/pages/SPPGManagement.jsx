import { useState, useEffect } from 'react';
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
  Package
} from 'lucide-react';

const SPPGManagement = () => {
  const { profile } = useOutletContext();
  const [sppgs, setSppgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/sppg');
      setSppgs(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      await fetchData();
    };
    initFetch();
  }, []);

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
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.kode_sppg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = profile?.role === 'admin' || profile?.role === 'sppg_head';

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Unit SPPG</h1>
           <p className="text-slate-500 mt-1">Manajemen Satuan Pelayanan Pemenuhan Gizi.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari unit atau kode..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64 shadow-sm"
              />
           </div>
           
           {canManage && (
             <button 
               onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
               className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
             >
                <Plus size={18} /> Tambah Unit
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredData.map((s) => (
          <div key={s.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-200/20 transition-all group relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <Building2 size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-800">{s.nama}</h3>
                      <p className="text-xs font-bold text-emerald-600 tracking-widest uppercase">{s.kode_sppg}</p>
                   </div>
                </div>
                <div className="flex gap-1">
                   {canManage && (
                     <>
                        <button onClick={() => handleEdit(s)} className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                           <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                           <Trash2 size={18} />
                        </button>
                     </>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="space-y-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kepala Satuan</p>
                   <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <User size={14} className="text-slate-300" />
                      {s.nama_kepala}
                   </div>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kapasitas Produksi</p>
                   <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Package size={14} className="text-slate-300" />
                      {s.kapasitas_produksi?.toLocaleString()} portions
                   </div>
                </div>
                <div className="col-span-2 space-y-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat Desa</p>
                   <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <MapPin size={14} className="text-slate-300 shrink-0" />
                      <span className="truncate">{s.alamat_desa}</span>
                   </div>
                </div>
             </div>

             <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {String.fromCharCode(64 + i)}
                     </div>
                   ))}
                   <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                      +
                   </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                  {s.status_operasional}
                </span>
             </div>
             
             {/* Subtle bg pattern */}
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
         <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Building2 size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium italic">No SPPG units found.</p>
         </div>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative w-full max-w-4xl animate-in zoom-in-95 duration-200">
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
