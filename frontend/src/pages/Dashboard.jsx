import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ClipboardCheck,
  ClipboardList,
  TrendingUp,
  Settings as SettingsIcon
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api';
import DailyMotivationModal from '../components/DailyMotivationModal';
import { ROLE_MENU_ACCESS, ENFORCE_REDIRECT_ROLES, ADMIN_ONLY_PATHS } from '../config/rolePermissions';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isCollapsed = !isPinned && !isHovered;
  const [isAllocating, setIsAllocating] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);
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

      try {
        const res = await api.get('/users');
        const currentUser = res.data.find(u => u.id === session.user.id);
        if (currentUser) {
          setProfile(currentUser);
          if (!sessionStorage.getItem('has_shown_daily_motivation')) {
            setShowMotivationModal(true);
            sessionStorage.setItem('has_shown_daily_motivation', 'true');
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
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

  // ─── REDIRECT ENFORCEMENT dari config ───
  useEffect(() => {
    if (!profile) return;
    if (ENFORCE_REDIRECT_ROLES.includes(profile.role)) {
      const allowed = ROLE_MENU_ACCESS[profile.role] || [];
      const isAllowed = allowed.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
      if (!isAllowed) navigate('/dashboard', { replace: true });
    }
  }, [profile, location.pathname, navigate]);

  // ─── SEMUA ITEM MENU (dengan icon mapping) ───
  const ALL_MENU_ITEMS = [
    { path: '/dashboard',                name: 'Dashboard',       icon: LayoutDashboard },
    { path: '/dashboard/mapping',        name: 'Mapping',         icon: MapIcon },
    { path: '/dashboard/sppg',           name: 'Unit SPPG',       icon: Briefcase },
    { path: '/dashboard/raport',         name: 'Raport Kinerja',  icon: ClipboardList },
    { path: '/dashboard/kelompok',       name: 'Kelompok',        icon: Users },
    { path: '/dashboard/komoditas-harga',name: 'Harga Bahan Baku',icon: TrendingUp },
    { path: '/dashboard/audit',          name: 'Audit Center',    icon: ClipboardCheck },
    { path: '/dashboard/settings',       name: 'Settings',        icon: SettingsIcon },
    // Admin-only
    { path: '/dashboard/users',          name: 'Users',           icon: Shield },
    { path: '/dashboard/logs',           name: 'Audit Log',       icon: History },
    { path: '/dashboard/landing-editor', name: 'Landing Page',    icon: MapIcon },
  ];

  // Ambil path yang diizinkan untuk role saat ini
  const role = profile?.role;
  const allowedPaths = ROLE_MENU_ACCESS[role] || ROLE_MENU_ACCESS['admin']; // fallback admin jika role baru

  // Menu utama = allowed paths dikurangi admin-only paths
  const menuItems = ALL_MENU_ITEMS.filter(
    item => allowedPaths.includes(item.path) && !ADMIN_ONLY_PATHS.includes(item.path)
  );

  // Seksi admin di bawah sidebar
  const adminItems = ALL_MENU_ITEMS.filter(
    item => allowedPaths.includes(item.path) && ADMIN_ONLY_PATHS.includes(item.path)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  const isMapPage = location.pathname === '/dashboard/mapping';

  const roleLabel = {
    admin: 'Administrator',
    kecamatan_coordinator: 'Koordinator Kec.',
    sppg_head: 'Kepala SPPG',
    nutrition_inspector: 'Pengawas Gizi',
    finance_inspector: 'Pengawas Keuangan',
  }[profile?.role] ?? profile?.role;

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => setIsSidebarOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        } ${isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : ''}`}
      >
        {isActive && !isCollapsed && (
          <span className="absolute left-0 inset-y-1 w-0.5 bg-blue-600 rounded-full" />
        )}
        <item.icon
          size={18}
          className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
        />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{ zIndex: 100001 }}
        toastOptions={{
          style: { borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
        }}
      />

      {/* ── Desktop Sidebar ── */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-200 ease-out ${isCollapsed ? 'w-[60px]' : 'w-56'}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-slate-100 px-4 gap-3 shrink-0 ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Database className="text-white" size={15} />
          </div>
          {!isCollapsed && (
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">SI-SPPG Sikur</span>
            </div>
          )}
        </div>

        {/* Pin toggle */}
        <button
          onClick={() => setIsPinned(!isPinned)}
          className="absolute -right-3 top-16 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:border-slate-300 transition-all z-50"
        >
          {isPinned ? <ChevronLeft size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-0.5">
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu</p>
          )}
          {menuItems.map((item) => <NavItem key={item.name} item={item} />)}

          {profile?.role === 'admin' && (
            <>
              <div className="my-3 border-t border-slate-100" />
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Admin</p>
              )}
              {adminItems.map((item) => <NavItem key={item.name} item={item} />)}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className={`border-t border-slate-100 p-3 space-y-1 shrink-0 ${isCollapsed ? 'items-center' : ''}`}>
          <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{roleLabel}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`group flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-200 ${isCollapsed ? 'lg:ml-[60px]' : 'lg:ml-56'}`}>
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Database className="text-white" size={15} />
            </div>
            <span className="font-bold text-base text-slate-900">GIS SPPG</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200 shrink-0">
          <div className="text-sm text-slate-400 font-medium">
            {menuItems.find(i => i.path === location.pathname)?.name ||
             adminItems.find(i => i.path === location.pathname)?.name ||
             'Dashboard'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-slate-700">{profile?.full_name || 'User'}</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className={`w-full ${isMapPage ? 'h-full' : 'p-4 lg:p-6 max-w-7xl mx-auto'}`}>
            <Outlet context={{ profile }} />
          </div>
        </div>

        {/* Auto Allocation FAB (Map Page, Admin) */}
        {isMapPage && profile?.role === 'admin' && (
          <button
            onClick={handleAutoAllocate}
            disabled={isAllocating}
            className={`fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-[1000] h-11 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2.5 transition-all duration-300 hover:bg-blue-700 active:scale-95 overflow-hidden ${
              isAllocating ? 'px-4 cursor-not-allowed opacity-75' : 'px-3 hover:px-4'
            }`}
          >
            {isAllocating ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Zap size={16} fill="currentColor" className="shrink-0" />}
            <span className="text-xs font-semibold whitespace-nowrap">
              {isAllocating ? 'Analyzing...' : 'Run Allocation'}
            </span>
          </button>
        )}

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur-lg border border-slate-200 rounded-2xl px-2 py-1.5 z-40 flex items-center justify-around shadow-lg">
          {(() => {
            // Take up to 4 items strictly from allowed menuItems
            const primaryItems = menuItems.slice(0, 4);
            return (
              <>
                {primaryItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all min-w-[48px] ${
                        isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
                      <span className={`text-[9px] font-semibold mt-1 whitespace-nowrap ${isActive ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                        {item.name === 'Harga Bahan Baku' ? 'Harga' : item.name === 'Raport Kinerja' ? 'Raport' : item.name === 'Unit SPPG' ? 'SPPG' : item.name === 'Kelompok' ? 'Kelompok' : item.name}
                      </span>
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-slate-400 hover:text-slate-700 transition-all min-w-[48px]"
                >
                  <Menu size={18} strokeWidth={1.75} />
                  <span className="text-[9px] font-semibold mt-1 text-slate-400">Lainnya</span>
                </button>
              </>
            );
          })()}
        </nav>
      </main>


      {/* Mobile Sidebar Slide-Over Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100000] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Slide Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl z-10"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between h-14 border-b border-slate-100 px-4 bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Database className="text-white" size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 leading-none block">GIS SPPG</span>
                    <span className="text-[10px] text-slate-400 font-medium">Kecamatan Sikur</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Menu List */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Navigasi Utama</p>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {profile?.role === 'admin' && adminItems.length > 0 && (
                  <>
                    <div className="my-3 border-t border-slate-100" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Administrasi</p>
                    {adminItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <item.icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </>
                )}
              </nav>

              {/* Drawer User Footer */}
              <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-1.5 shrink-0">
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{roleLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>


      {/* Daily Motivation Modal */}
      <DailyMotivationModal
        isOpen={showMotivationModal}
        onClose={() => setShowMotivationModal(false)}
        userName={profile?.full_name}
      />
    </div>
  );
};

export default Dashboard;
