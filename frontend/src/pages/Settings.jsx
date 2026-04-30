import { useState } from 'react';
import { 
  User, 
  Map as MapIcon, 
  Database, 
  History, 
  Save, 
  Download, 
  Lock, 
  Globe, 
  Layers, 
  CheckCircle2
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const ProfileForm = ({ profile }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/profile', profileData);
      toast.success('Profil berhasil diperbarui!');
    } catch (error) {
      toast.error('Gagal memperbarui profil.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
         <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <User size={24} />
         </div>
         <div>
            <h3 className="text-xl font-black text-slate-800">Profil Pengguna</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Informasi Akun Utama</p>
         </div>
      </div>

      <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-xl">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
          <input 
            type="text" 
            value={profileData.full_name}
            onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            placeholder="Masukkan nama lengkap..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Alamat Email</label>
          <input 
            type="email" 
            value={profileData.email}
            disabled
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold opacity-60 cursor-not-allowed"
          />
          <p className="text-[10px] text-slate-400 font-medium px-1 italic">* Email tidak dapat diubah secara manual.</p>
        </div>
        
        <div className="pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
          </button>
        </div>
      </form>
    </div>
  );
};

const Settings = () => {
  const { profile } = useOutletContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [mapSettings, setMapSettings] = useState({
    satelliteView: false,
    radiusAllocation: 10
  });

  const exportAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit-logs/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('Log audit berhasil diunduh!');
    } catch (error) {
      toast.error('Gagal mengunduh log audit.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, adminOnly: false },
    { id: 'map', name: 'Map Config', icon: MapIcon, adminOnly: false },
    { id: 'system', name: 'System', icon: Database, adminOnly: true },
    { id: 'audit', name: 'Security Audit', icon: History, adminOnly: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || profile?.role === 'admin');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium mt-1">Konfigurasi akun dan preferensi sistem pemetaan.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Sub-menu */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-500/5 p-3 space-y-2">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <tab.icon size={20} />
                {tab.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-[3rem] border border-blue-100 shadow-2xl shadow-blue-500/5 p-8 lg:p-12">
            {activeTab === 'profile' && <ProfileForm key={profile?.id} profile={profile} />}

            {activeTab === 'map' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                      <MapIcon size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800">Konfigurasi Peta</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Preferensi Visual & Analisis</p>
                   </div>
                </div>

                <div className="space-y-10 max-w-xl">
                  <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                          <Globe size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-800">Tampilan Satelit</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Gunakan layer satelit sebagai default</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setMapSettings({...mapSettings, satelliteView: !mapSettings.satelliteView})}
                      className={`w-14 h-8 rounded-full transition-all relative ${mapSettings.satelliteView ? 'bg-blue-600 shadow-inner' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${mapSettings.satelliteView ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 px-1">
                       <Layers size={18} className="text-blue-600" />
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Radius Alokasi Default (km)</label>
                    </div>
                    <div className="relative">
                       <input 
                        type="number" 
                        value={mapSettings.radiusAllocation}
                        onChange={(e) => setMapSettings({...mapSettings, radiusAllocation: parseInt(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">KILOMETER</div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium px-1">Radius ini digunakan sebagai batasan awal pada algoritma alokasi otomatis.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                      <Database size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800">Sistem & Data</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Pemeliharaan & Export Data</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-8 rounded-[2rem] border border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                            <History size={20} />
                         </div>
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Export Audit Logs</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-8">Unduh seluruh riwayat aktivitas sistem dalam format CSV untuk keperluan audit dan pelaporan.</p>
                      <button 
                        onClick={exportAuditLogs}
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                         <Download size={16} /> Download CSV
                      </button>
                   </div>

                   <div className="p-8 rounded-[2rem] border border-amber-100 bg-amber-50/30">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500">
                            <Lock size={20} />
                         </div>
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Keamanan Data</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-8">Seluruh data koordinat dan informasi pribadi terenkripsi dan disimpan di database PostGIS yang aman.</p>
                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                         <CheckCircle2 size={14} /> Sistem Terlindungi
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center py-20">
                 <div className="bg-blue-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-blue-600">
                    <History size={40} />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">Security Audit Logs</h3>
                 <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Fitur analisis audit mendalam akan segera tersedia untuk meningkatkan transparansi operasional.</p>
                 <button 
                  onClick={() => setActiveTab('system')}
                  className="mt-8 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                 >
                    Gunakan Export CSV Sementara
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
