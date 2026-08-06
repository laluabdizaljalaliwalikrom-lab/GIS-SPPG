import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCog, 
  Shield, 
  ShieldCheck, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  Plus,
  Mail,
  Lock,
  Save,
  X,
  Building2,
  Apple,
  DollarSign,
  User as UserIcon
} from 'lucide-react';

const UserManagement = () => {
  const { profile } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [sppgUnits, setSppgUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, sppgRes] = await Promise.all([
        api.get('/users'),
        api.get('/sppg')
      ]);
      setUsers(usersRes.data);
      setSppgUnits(sppgRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (formData) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || 'Error saving user');
    }
  };

  const handleDelete = async (id) => {
    if (id === profile.id) {
       alert("Anda tidak dapat menghapus akun Anda sendiri.");
       return;
    }
    if (!window.confirm('Yakin ingin menghapus profil user ini? Akun auth tetap ada di Supabase tetapi akses dashboard akan hilang.')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error deleting user');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.sppg_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Manajemen User & Hak Akses</h1>
           <p className="text-slate-500 font-medium text-sm lg:text-base">Kelola 5 peran pengguna dan ikatan unit SPPG pengguna.</p>
        </div>
        
        <div className="flex gap-2">
           <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama, role, atau SPPG..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-72 pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
              />
           </div>
           <button 
             onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
             className="hidden lg:flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
           >
              <Plus size={18} /> Tambah User
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-48 bg-white rounded-[2rem] animate-pulse border border-slate-100" />
          ))
        ) : filteredUsers.map((u) => (
          <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-200/30 transition-all group relative overflow-hidden flex flex-col justify-between">
             <div className="space-y-4">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 font-black">
                        <UserIcon size={24} />
                     </div>
                     <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-800 truncate">{u.full_name || 'No Name'}</h3>
                        <p className="text-[9px] font-mono text-slate-400 truncate">{u.id}</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <RoleBadge role={u.role} />
                  
                  {u.sppg_id ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                      <Building2 size={14} className="text-blue-600 shrink-0" />
                      <span className="truncate">{u.sppg_name || `SPPG Unit #${u.sppg_id}`}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50/70 px-3 py-1 rounded-xl uppercase tracking-wider">
                      🌐 Akses Global (Tanpa Ikatan Unit)
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] tracking-widest uppercase bg-emerald-50 w-fit px-3 py-1 rounded-full">
                     <CheckCircle2 size={12} /> Akun Aktif
                  </div>
               </div>
             </div>

             <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  onClick={() => { setEditingUser(u); setIsModalOpen(true); }}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                   <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(u.id)}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                   <Trash2 size={18} />
                </button>
             </div>
             
             <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10" />
          </div>
        ))}
      </div>

      <button 
        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-400 flex items-center justify-center active:scale-90 transition-transform z-50 ring-4 ring-white"
      >
         <Plus size={28} />
      </button>

      {isModalOpen && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 w-screen h-screen z-[9999] flex items-end lg:items-center justify-center p-0 lg:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full lg:max-w-lg flex flex-col my-auto"
            >
                <div className="bg-blue-600 rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-blue-600 will-change-transform">
                  <div className="p-6 lg:p-8 bg-blue-600 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                         {editingUser ? <UserCog size={24} /> : <Plus size={24} />}
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight">{editingUser ? 'Edit Akses' : 'Tambah User'}</h2>
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Pengaturan Keamanan & Peran</p>
                      </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white">
                    <UserEditForm 
                      user={editingUser} 
                      sppgUnits={sppgUnits}
                      onSave={handleSave} 
                      onCancel={() => setIsModalOpen(false)} 
                      />
                  </div>
                </div>
              </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const configs = {
    admin: { label: 'Administrator', color: 'bg-red-50 text-red-600 border-red-200', icon: ShieldCheck },
    kecamatan_coordinator: { label: 'Koordinator Kec.', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: UserCog },
    sppg_head: { label: 'Kepala Unit SPPG', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Shield },
    nutrition_inspector: { label: 'Pengawas Gizi', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Apple },
    finance_inspector: { label: 'Pengawas Keuangan', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: DollarSign },
  };
  const config = configs[role] || { label: role, color: 'bg-slate-50 text-slate-500 border-slate-200', icon: Shield };
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-tight ${config.color}`}>
       <Icon size={12} />
       {config.label}
    </div>
  );
};

const UserEditForm = ({ user, sppgUnits = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    role: user?.role || 'sppg_head',
    sppg_id: user?.sppg_id || '',
    email: '',
    password: ''
  });

  const isBoundRole = ['sppg_head', 'nutrition_inspector', 'finance_inspector'].includes(formData.role);

  return (
    <div>
       <form onSubmit={(e) => { 
         e.preventDefault(); 
         const payload = {
           full_name: formData.full_name,
           role: formData.role,
           sppg_id: isBoundRole ? (formData.sppg_id ? parseInt(formData.sppg_id) : null) : null
         };
         if (!user) {
           payload.email = formData.email;
           payload.password = formData.password;
         }
         if (isBoundRole && !payload.sppg_id) {
           alert('Peran ini wajib memilih Unit SPPG!');
           return;
         }
         onSave(payload); 
       }} className="space-y-5">
          {!user && (
            <>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" required
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({...p, email: e.target.value}))}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                      placeholder="user@example.com"
                    />
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" required
                      value={formData.password}
                      onChange={(e) => setFormData(p => ({...p, password: e.target.value}))}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                      placeholder="••••••••"
                    />
                 </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-700 ml-1">Nama Lengkap Pengguna</label>
             <input 
               type="text" required
               value={formData.full_name}
               onChange={(e) => setFormData(p => ({...p, full_name: e.target.value}))}
               className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
               placeholder="Contoh: Ahmad Rizki, S.Gz"
             />
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-700 ml-1">Peran Akses Sistem (Role)</label>
             <select 
               value={formData.role}
               onChange={(e) => setFormData(p => ({...p, role: e.target.value}))}
               className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
             >
                <option value="admin">🔴 System Administrator (Global)</option>
                <option value="kecamatan_coordinator">🔵 Koordinator Kecamatan (Global)</option>
                <option value="sppg_head">🟢 Kepala Unit SPPG (Terikat SPPG)</option>
                <option value="nutrition_inspector">🟣 Pengawas Gizi (Terikat SPPG)</option>
                <option value="finance_inspector">🟡 Pengawas Keuangan (Terikat SPPG & Survey Harga)</option>
             </select>
          </div>

          {/* SPPG Unit Binding Dropdown for Bound Roles */}
          {isBoundRole && (
            <div className="space-y-1.5 p-4 bg-blue-50/60 border border-blue-200 rounded-2xl">
               <label className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Building2 size={16} className="text-blue-600" />
                  Pilih Unit SPPG Terikat <span className="text-red-500">*</span>
               </label>
               <p className="text-[10px] text-blue-700 font-medium">
                  Pengguna peran ini hanya akan mengelola dan melihat data pada SPPG yang dipilih.
               </p>
               <select
                 required
                 value={formData.sppg_id || ''}
                 onChange={(e) => setFormData(p => ({...p, sppg_id: e.target.value}))}
                 className="w-full px-3.5 py-3 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
               >
                 <option value="">— Pilih Unit SPPG —</option>
                 {sppgUnits.map(unit => (
                   <option key={unit.id} value={unit.id}>
                     {unit.nama} ({unit.kode_sppg || `ID ${unit.id}`}) - {unit.alamat_desa || 'Sikur'}
                   </option>
                 ))}
               </select>
            </div>
          )}

          <div className="flex flex-col-reverse lg:flex-row gap-3 pt-3">
             <button type="button" onClick={onCancel} className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Batal</button>
             <button type="submit" className="flex-[2] py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                <Save size={18} />
                {user ? 'Simpan Perubahan' : 'Daftarkan User Baru'}
             </button>
          </div>
       </form>
    </div>
  );
};

export default UserManagement;
