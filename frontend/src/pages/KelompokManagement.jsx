import { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';

const KelompokManagement = () => {
  const { profile } = useOutletContext();
  const [kelompoks, setKelompoks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/kelompok');
      setKelompoks(res.data);
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
    const matchesSearch = k.nama.toLowerCase().includes(searchTerm.toLowerCase()) || k.kode_kelompok.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Kelompok Penerima</h1>
           <p className="text-slate-500 mt-1">Kelola dan verifikasi data kelompok penerima gizi.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search name or code..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64 shadow-sm"
              />
           </div>
           
           <button 
             onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
             className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
           >
              <Plus size={18} /> Tambah
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex gap-2 overflow-x-auto">
           {['all', 'pending_verification', 'verified', 'rejected'].map(status => (
             <button
               key={status}
               onClick={() => setStatusFilter(status)}
               className={cn(
                 "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                 statusFilter === status 
                   ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100" 
                   : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
               )}
             >
               {status === 'all' ? 'Semua Data' : status.replace('_', ' ').toUpperCase()}
             </button>
           ))}
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kelompok Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type & Ownership</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((k) => (
              <tr key={k.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                         <Users size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-slate-800">{k.nama}</p>
                         <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={10} /> {k.alamat_lengkap}
                         </p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="space-y-1">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase">{k.jenis_kelompok}</span>
                      <p className="text-xs text-slate-500">{k.jenis_kepemilikan}</p>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <StatusBadge status={k.status} />
                </td>
                <td className="px-6 py-5">
                   <div className="flex justify-end gap-2">
                      {profile?.role === 'kecamatan_coordinator' && k.status === 'pending_verification' && (
                        <>
                          <button onClick={() => handleVerify(k.id, 'verified')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Verify">
                             <CheckCircle2 size={18} />
                          </button>
                          <button onClick={() => handleVerify(k.id, 'rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reject">
                             <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleEdit(k)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                         <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(k.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                         <Trash2 size={18} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredData.length === 0 && (
          <div className="p-20 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-slate-200" />
             </div>
             <p className="text-slate-400 font-medium">No groups found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative w-full max-w-4xl animate-in zoom-in-95 duration-200">
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
    pending_verification: 'bg-amber-50 text-amber-600 border-amber-100',
    verified: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-600 border-red-100'
  };
  const icons = { pending_verification: Clock, verified: CheckCircle2, rejected: XCircle };
  const Icon = icons[status] || Clock;
  const label = status?.replace('_', ' ').toUpperCase() || 'UNKNOWN';
  
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold", styles[status])}>
       <Icon size={12} />
       {label}
    </div>
  );
};

const cn = (...inputs) => inputs.filter(Boolean).join(' ');

export default KelompokManagement;
