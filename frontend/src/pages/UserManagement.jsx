import { useState, useEffect } from 'react';
import api from '../api';
import { useOutletContext } from 'react-router-dom';
import { 
  Users, 
  UserCog, 
  Shield, 
  ShieldCheck, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  CheckCircle2,
  Plus,
  Mail,
  Lock,
  Save
} from 'lucide-react';

const UserManagement = () => {
  const { profile } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
    (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
           <p className="text-slate-500 mt-1">Kelola hak akses dan peran pengguna sistem.</p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama atau role..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64 shadow-sm"
              />
           </div>
           <button 
             onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
             className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
           >
              <Plus size={18} /> Tambah User
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-slate-400">Loading users...</td>
              </tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                         <Users size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-slate-800">{u.full_name || 'No Name'}</p>
                         <p className="text-[10px] text-slate-400 font-mono">{u.id}</p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <RoleBadge role={u.role} />
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 size={14} /> Active
                   </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingUser(u); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                         <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-200">
              <UserEditForm 
                user={editingUser} 
                onSave={handleSave} 
                onCancel={() => setIsModalOpen(false)} 
              />
           </div>
        </div>
      )}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const configs = {
    admin: { label: 'Admin', color: 'bg-red-50 text-red-600 border-red-100', icon: ShieldCheck },
    sppg_head: { label: 'Head of SPPG', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Shield },
    kecamatan_coordinator: { label: 'Coordinator', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: UserCog }
  };
  const config = configs[role] || { label: role, color: 'bg-slate-50 text-slate-500 border-slate-100', icon: Shield };
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold ${config.color}`}>
       <Icon size={12} />
       {config.label.toUpperCase()}
    </div>
  );
};

const UserEditForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    role: user?.role || 'kecamatan_coordinator',
    email: '',
    password: ''
  });

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl">
       <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                {user ? <UserCog size={24} /> : <Plus size={24} />}
             </div>
             <div>
                <h2 className="text-2xl font-bold text-slate-800">{user ? 'Edit User Role' : 'Tambah User Baru'}</h2>
                <p className="text-sm text-slate-500">{user ? 'Ubah peran dan hak akses user.' : 'Daftarkan pengguna baru ke sistem.'}</p>
             </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl">
             <X size={24} className="text-slate-400" />
          </button>
       </div>

       <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          {!user && (
            <>
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" required
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({...p, email: e.target.value}))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      placeholder="user@example.com"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" required
                      value={formData.password}
                      onChange={(e) => setFormData(p => ({...p, password: e.target.value}))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      placeholder="••••••••"
                    />
                 </div>
              </div>
            </>
          )}

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
             <input 
               type="text" required
               value={formData.full_name}
               onChange={(e) => setFormData(p => ({...p, full_name: e.target.value}))}
               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
               placeholder="John Doe"
             />
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700 ml-1">Assigned Role</label>
             <select 
               value={formData.role}
               onChange={(e) => setFormData(p => ({...p, role: e.target.value}))}
               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
             >
                <option value="admin">System Administrator</option>
                <option value="sppg_head">Head of SPPG Unit</option>
                <option value="kecamatan_coordinator">Kecamatan Coordinator</option>
             </select>
          </div>

          <div className="flex gap-4 pt-4">
             <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
             <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                <Save size={20} />
                {user ? 'Update Profile' : 'Daftarkan User'}
             </button>
          </div>
       </form>
    </div>
  );
};

export default UserManagement;
