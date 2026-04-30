import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useOutletContext } from 'react-router-dom';
import KelompokForm from '../components/KelompokForm';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Check
} from 'lucide-react';

const KelompokManagement = () => {
  const { profile } = useOutletContext();
  const [kelompoks, setKelompoks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/kelompok');
      setKelompoks(res.data);
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
        await api.put(`/kelompok/${editingItem.id}`, formData);
      } else {
        await api.post('/kelompok', formData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error saving data');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await api.delete(`/kelompok/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error deleting data');
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.post(`/kelompok/${id}/verify`, { status });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  const filteredData = kelompoks.filter(k => {
    const matchesSearch = k.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || k.kode_kelompok?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                className="w-full lg:w-64 pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
              />
           </div>
           
           <button 
             onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
             className="hidden lg:flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
           >
              <Plus size={18} /> Tambah Data
           </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
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
             {status === 'all' ? 'Semua' : status.replace('_', ' ')}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredData.map((k) => (
          <div key={k.id} className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-200/30 transition-all group relative overflow-hidden flex flex-col">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Users size={24} />
                   </div>
                   <div className="min-w-0">
                      <h3 className="text-lg lg:text-xl font-black text-slate-800 truncate">{k.nama}</h3>
                      <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">{k.kode_kelompok}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-4 flex-1">
                <div className="flex gap-3 mb-4">
                   <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-tighter">{k.jenis_kelompok}</span>
                   <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-tighter">{k.jenis_kepemilikan}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-3xl space-y-3">
                   <div className="flex items-start gap-2 text-slate-600 font-medium text-[11px] leading-relaxed">
                      <MapPin size={12} className="text-blue-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{k.alamat_lengkap}</span>
                   </div>
                   
                   <div className="pt-3 border-t border-slate-100">
                      <StatusBadge status={k.status} />
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-2">
                   {profile?.role === 'kecamatan_coordinator' && k.status === 'pending_verification' && (
                     <>
                       <button onClick={() => handleVerify(k.id, 'verified')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Verify">
                          <Check size={18} />
                       </button>
                       <button onClick={() => handleVerify(k.id, 'rejected')} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Reject">
                          <XCircle size={18} />
                       </button>
                     </>
                   )}
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleEdit(k)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Edit2 size={16} />
                   </button>
                   <button onClick={() => handleDelete(k.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
         <div className="p-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter size={40} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">Tidak ada data ditemukan.</p>
         </div>
      )}

      {/* FAB (Mobile Only) */}
      <button 
        onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-400 flex items-center justify-center active:scale-90 transition-transform z-50 ring-4 ring-white"
      >
         <Plus size={28} />
      </button>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative w-full lg:max-w-4xl bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] p-6 lg:p-0 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 lg:slide-in-from-bottom-4 duration-300">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 lg:hidden" />
              <KelompokForm 
                key={editingItem?.id || 'new'}
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

const StatusBadge = ({ status }) => {
  const styles = {
    pending_verification: 'text-amber-600',
    verified: 'text-emerald-600',
    rejected: 'text-red-600'
  };
  const icons = { pending_verification: Clock, verified: CheckCircle2, rejected: XCircle };
  const Icon = icons[status] || Clock;
  const label = status === 'pending_verification' ? 'MENUNGGU VERIFIKASI' : status?.toUpperCase() || 'UNKNOWN';
  
  return (
    <div className={`flex items-center gap-2 text-[10px] font-black tracking-tight ${styles[status]}`}>
       <Icon size={14} />
       {label}
    </div>
  );
};

export default KelompokManagement;
