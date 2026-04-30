import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Building2, 
  Users, 
  History, 
  Bell, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Menu,
  User as UserIcon,
  UserCog
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(...inputs));
}

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Fetch profile for role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profile);

      // Fetch pending verifications count for badge
      if (profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator') {
        const { count } = await supabase
          .from('kelompok_penerima')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_verification');
        setNotifications(count || 0);
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'sppg_head', 'kecamatan_coordinator'] },
    { name: 'Mapping', path: '/map', icon: MapIcon, roles: ['admin', 'sppg_head', 'kecamatan_coordinator'] },
    { name: 'SPPG Units', path: '/sppg', icon: Building2, roles: ['admin', 'sppg_head'] },
    { name: 'Kelompok Penerima', path: '/kelompok', icon: Users, roles: ['admin', 'kecamatan_coordinator'], badge: notifications },
    { name: 'Audit Trail', path: '/logs', icon: History, roles: ['admin'] },
    { name: 'User Management', path: '/users', icon: UserCog, roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-slate-200 h-full flex flex-col sidebar-transition z-30 shadow-sm",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
            <LayoutDashboard className="text-white" size={20} />
          </div>
          {!collapsed && <span className="font-bold text-xl text-slate-800 tracking-tight">GIS-SPPG</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "nav-item relative group",
                  isActive ? "active" : ""
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
                {item.badge > 0 && !collapsed && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.badge > 0 && collapsed && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={cn("flex items-center gap-3 p-3 rounded-2xl bg-slate-50", collapsed && "justify-center")}>
            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <UserIcon size={20} className="text-slate-500" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name || 'Loading...'}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{profile?.role?.replace('_', ' ')}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full mt-3 flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-semibold text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Toggle Button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="fixed bottom-6 left-6 z-50 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl hover:bg-slate-50 md:flex hidden"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 shadow-sm md:hidden">
            <div className="flex items-center gap-3">
               <Menu size={24} className="text-slate-600" onClick={() => setCollapsed(!collapsed)}/>
               <span className="font-bold text-lg text-slate-800">GIS-SPPG</span>
            </div>
            <Bell size={20} className="text-slate-400" />
        </header>
        
        <div className="flex-1 overflow-auto p-8 relative">
           <Outlet context={{ profile, notifications }} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
