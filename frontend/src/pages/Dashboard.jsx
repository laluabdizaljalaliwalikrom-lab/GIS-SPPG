import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { 
  Map as MapIcon, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Database,
  History,
  Shield,
  Briefcase,
  User,
  Zap,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ClipboardCheck,
  ClipboardList,
  Settings as SettingsIcon
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        localStorage.setItem('access_token', session.access_token);
      } else {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const handleAutoAllocate = async () => {
    setIsAllocating(true);
    const toastId = toast.loading('Processing PostGIS Spatial Analysis...', {
       style: {
          borderRadius: '1.5rem',
          background: '#1e293b',
          color: '#fff',
          fontWeight: 'bold',
          padding: '1rem 1.5rem'
       }
    });

    try {
      const res = await api.post('/allocate');
      toast.success(`Berhasil! ${res.data.assigned_count} kelompok telah dialokasikan.`, { 
        id: toastId,
        icon: '🚀',
        duration: 4000
      });
      // Invalidate queries to refresh map and tables
      queryClient.invalidateQueries({ queryKey: ['sppgs'] });
      queryClient.invalidateQueries({ queryKey: ['kelompoks'] });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Gagal menjalankan alokasi otomatis.', { id: toastId });
    } finally {
      setIsAllocating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mapping', path: '/dashboard/mapping', icon: MapIcon },
    { name: 'Unit SPPG', path: '/dashboard/sppg', icon: Briefcase },
    { name: 'Raport Kinerja', path: '/dashboard/raport', icon: ClipboardList },
    { name: 'Kelompok', path: '/dashboard/kelompok', icon: Users },
    ...((profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator')
      ? [{ name: 'Audit Center', path: '/dashboard/audit', icon: ClipboardCheck }]
      : []),
    { name: 'Settings', path: '/dashboard/settings', icon: SettingsIcon },
  ];

  const adminItems = [
    { name: 'Landing Page', path: '/dashboard/landing-editor', icon: MapIcon },
    { name: 'Audit Log', path: '/dashboard/logs', icon: History },
    { name: 'Users', path: '/dashboard/users', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isMapPage = location.pathname === '/dashboard/mapping';

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        containerStyle={{
          zIndex: 100001,
        }}
      />
      
      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-blue-100 shadow-xl transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-24' : 'w-72'}`}>
        <div className="h-full flex flex-col p-4 lg:p-6 relative">
          {/* Collapse Toggle Button (Desktop Only) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-4 top-12 w-8 h-8 bg-white border border-blue-100 rounded-full items-center justify-center text-blue-600 shadow-lg hover:scale-110 transition-all z-50"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div className={`flex items-center gap-3 mb-10 px-2 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200 shrink-0">
              <Database className="text-white" size={24} />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in duration-300">
                <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">GIS SPPG</h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Navigation</p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar py-4">
            <div className={`px-4 mb-4 ${isCollapsed ? 'flex justify-center px-0' : ''}`}>
              {isCollapsed ? (
                <div className="w-4 h-0.5 bg-slate-100 rounded-full" />
              ) : (
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em]">Menu Utama</p>
              )}
            </div>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center rounded-2xl transition-all duration-300 group relative ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' 
                      : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                  } ${isCollapsed ? 'w-12 h-12 mx-auto justify-center' : 'gap-4 px-4 py-3.5'}`}
                >
                  <item.icon size={20} className={`${isActive ? 'text-white' : 'group-hover:text-blue-600'} transition-all duration-300 ${isCollapsed ? 'shrink-0' : ''}`} />
                  {!isCollapsed && <span className="text-sm truncate animate-in slide-in-from-left-2 duration-300">{item.name}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap shadow-xl">
                       {item.name}
                    </div>
                  )}
                </Link>
              );
            })}

            {profile?.role === 'admin' && (
              <>
                <div className={`px-4 mt-10 mb-4 ${isCollapsed ? 'flex justify-center px-0' : ''}`}>
                  {isCollapsed ? (
                    <div className="w-4 h-0.5 bg-slate-100 rounded-full" />
                  ) : (
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em]">Administrasi</p>
                  )}
                </div>
                {adminItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center rounded-2xl transition-all duration-300 group relative ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' 
                          : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                      } ${isCollapsed ? 'w-12 h-12 mx-auto justify-center' : 'gap-4 px-4 py-3.5'}`}
                    >
                      <item.icon size={20} className={`${isActive ? 'text-white' : 'group-hover:text-blue-600'} transition-all duration-300 ${isCollapsed ? 'shrink-0' : ''}`} />
                      {!isCollapsed && <span className="text-sm truncate animate-in slide-in-from-left-2 duration-300">{item.name}</span>}
                      
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap shadow-xl">
                           {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-50 space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-[1.5rem] bg-slate-50/50 transition-all ${isCollapsed ? 'justify-center p-2' : ''}`}>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <User size={20} />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in duration-500">
                  <p className="text-sm font-black text-slate-800 truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mt-1">{profile?.role?.replace('_', ' ')}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group relative ${isCollapsed ? 'w-12 h-12 mx-auto justify-center' : 'gap-4 px-4 py-3.5 w-full'}`}
            >
              <LogOut size={20} className="group-hover:text-red-600 transition-all duration-300" />
              {!isCollapsed && <span className="text-sm font-black animate-in fade-in duration-500">Logout</span>}
              
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap shadow-xl">
                   Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 lg:pl-6">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
              <Database className="text-white" size={16} />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-800 uppercase">GIS SPPG</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 bg-slate-50 rounded-xl border border-slate-100">
             {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Dynamic Content Scroll Area */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0 scroll-smooth flex flex-col">
          <div className={`flex-1 w-full ${location.pathname === '/dashboard/mapping' ? 'h-full' : 'p-4 lg:p-10 max-w-7xl mx-auto'}`}>
             <Outlet context={{ profile }} />
          </div>
        </div>

        {/* Auto Allocation Action Button (Map Page & Admin Only) */}
        {isMapPage && profile?.role === 'admin' && (
          <button
            onClick={handleAutoAllocate}
            disabled={isAllocating}
            className={`fixed bottom-32 right-6 lg:bottom-12 lg:right-12 z-[1000] h-10 lg:h-12 bg-blue-600 text-white rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.4)] flex items-center justify-center transition-all duration-500 ring-2 ring-white active:scale-90 overflow-hidden ${
              isAllocating ? 'animate-pulse cursor-not-allowed px-5' : 'hover:scale-105 px-3 lg:px-4 lg:hover:px-6'
            } ${isAllocating ? 'w-auto' : 'w-10 lg:w-12 lg:hover:w-auto'} group`}
          >
             <div className="flex items-center gap-2.5">
                <div className={isAllocating ? 'block' : 'block'}>
                   {isAllocating ? (
                     <Loader2 size={18} className="animate-spin" />
                   ) : (
                     <Zap size={18} fill="currentColor" className="transition-transform group-hover:rotate-12" />
                   )}
                </div>
                
                {/* Desktop Text Label - Shows on hover or when allocating */}
                <span className={`font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                  isAllocating ? 'block' : 'hidden lg:group-hover:block'
                }`}>
                  {isAllocating ? 'Analyzing...' : 'Run Allocation'}
                </span>
             </div>
          </button>
        )}

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl p-2 z-40 flex justify-around items-center shadow-[0_20px_50px_rgba(37,99,235,0.15)] ring-1 ring-slate-900/5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'text-slate-400'}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'block' : 'hidden md:block'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
