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
  CheckCircle2,
  Crosshair,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import RaportPointManager from '../components/RaportPointManager';

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
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : <><Save size={15} /> Simpan Perubahan</>}
          </button>
        </div>
      </form>
    </div>
  );
};

const SmartAuditSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/system-settings');
        const setting = (res.data || []).find(s => s.key === 'gemini_api_key');
        if (active && setting) setIsConfigured(setting.is_configured);
      } catch (err) {
        console.error(err);
        if (active) toast.error('Gagal memuat konfigurasi Smart Audit.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/system-settings/gemini_api_key', {
        key: 'gemini_api_key',
        value: apiKey,
        is_secret: true,
      });
      setIsConfigured(Boolean(apiKey && apiKey.trim()));
      setApiKey('');
      toast.success('Konfigurasi Gemini berhasil disimpan!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan konfigurasi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-fuchsia-50 rounded-lg flex items-center justify-center text-fuchsia-600">
          <Sparkles size={17} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Smart Audit &mdash; Gemini OCR</h3>
          <p className="text-xs text-slate-400">Konfigurasi OCR cerdas untuk pembacaan dokumen</p>
        </div>
      </div>

      <div className="space-y-5 max-w-xl">
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${isConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {isConfigured ? <CheckCircle2 size={18} /> : <KeyRound size={18} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isConfigured ? 'OCR Gemini Aktif' : 'OCR Gemini Belum Dikonfigurasi'}
            </p>
            <p className="text-xs text-slate-500">
              {isConfigured
                ? 'API key Gemini tersedia untuk pembacaan nota/RAB yang akurat.'
                : 'Tanpa API key, hanya PDF berbasis teks yang dapat diproses; gambar akan gagal.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">GEMINI_API_KEY</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={isConfigured ? '•••••••• (isi untuk mengganti key)' : 'Masukkan API key Gemini'}
                className="input pr-10"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Tampilkan/sembunyikan key"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {isConfigured
                ? 'Kosongkan lalu klik Simpan untuk mempertahankan key yang sudah tersimpan.'
                : 'Key tersimpan aman di database (diakses admin saja). Prioritas: variabel lingkungan GEMINI_API_KEY di server.'
                }
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || loading}
              className="btn-primary"
            >
              {saving ? 'Menyimpan...' : <><Save size={15} /> Simpan</>}
            </button>
          </div>
        </form>
      </div>
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
    { id: 'smart-audit', name: 'Smart Audit', icon: Sparkles, adminOnly: true },
    { id: 'audit', name: 'Security Audit', icon: History, adminOnly: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || profile?.role === 'admin');

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="page-header">Settings</h1>
        <p className="page-subtitle">Konfigurasi akun dan preferensi sistem pemetaan.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Sub-menu */}
        <aside className="lg:w-52 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 space-y-0.5">
            {filteredTabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'} />
                {tab.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            {activeTab === 'profile' && <ProfileForm key={profile?.id} profile={profile} />}

            {activeTab === 'map' && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    <MapIcon size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Konfigurasi Peta</h3>
                    <p className="text-xs text-slate-400">Preferensi Visual & Analisis</p>
                  </div>
                </div>

                <div className="space-y-5 max-w-xl">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400">
                        <Globe size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Tampilan Satelit</p>
                        <p className="text-xs text-slate-400">Gunakan layer satelit sebagai default</p>
                      </div>
                    </div>
                    <button onClick={() => setMapSettings({...mapSettings, satelliteView: !mapSettings.satelliteView})}
                      className={`w-12 h-6 rounded-full transition-all relative ${mapSettings.satelliteView ? 'bg-blue-600' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-all ${mapSettings.satelliteView ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                      <Layers size={14} className="text-blue-600" /> Radius Alokasi Default (km)
                    </label>
                    <div className="relative">
                      <input type="number" value={mapSettings.radiusAllocation}
                        onChange={(e) => setMapSettings({...mapSettings, radiusAllocation: parseInt(e.target.value)})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">km</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <Crosshair size={13} className="text-red-500" /> Latitude (Default)
                      </p>
                      <input type="text" defaultValue="-8.625"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500">Longitude (Default)</p>
                      <input type="text" defaultValue="116.44"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'raport' && <RaportPointManager />}

            {activeTab === 'smart-audit' && <SmartAuditSettings />}

            {activeTab === 'system' && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600">
                    <Database size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Sistem & Data</h3>
                    <p className="text-xs text-slate-400">Pemeliharaan & Export Data</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-blue-600">
                        <History size={16} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800">Export Audit Logs</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">Unduh seluruh riwayat aktivitas sistem dalam format CSV untuk keperluan audit dan pelaporan.</p>
                    <button onClick={exportAuditLogs} disabled={loading}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      <Download size={14} /> Download CSV
                    </button>
                  </div>

                  <div className="p-5 rounded-xl border border-amber-100 bg-amber-50/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-amber-500">
                        <Lock size={16} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800">Keamanan Data</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">Seluruh data koordinat dan informasi pribadi terenkripsi dan disimpan di database PostGIS yang aman.</p>
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={14} /> Sistem Terlindungi
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <History size={24} />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Security Audit Logs</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Fitur analisis audit mendalam akan segera tersedia untuk meningkatkan transparansi operasional.</p>
                <button onClick={() => setActiveTab('system')}
                  className="mt-5 text-xs font-medium text-blue-600 hover:underline">
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
