import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Clock, 
  TrendingUp, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Map as MapIcon,
  Activity
} from 'lucide-react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../api';

const StatsOverview = () => {
  const { profile } = useOutletContext();
  const [stats, setStats] = useState({
    totalCapacity: 0,
    totalKelompok: 0,
    pendingKelompok: 0,
    activeSppg: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sppgRes, kelompokRes] = await Promise.all([
          api.get('/sppg'),
          api.get('/kelompok')
        ]);
        setStats({
          totalCapacity: sppgRes.data.reduce((acc, s) => acc + (s.kapasitas_produksi || 0), 0),
          totalKelompok: kelompokRes.data.length,
          pendingKelompok: kelompokRes.data.filter(k => k.status === 'pending_verification').length,
          activeSppg: sppgRes.data.length
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-slate-200 rounded-[3rem]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header Section - High Impact */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-[3rem] p-8 lg:p-12 text-white shadow-2xl shadow-blue-500/20">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30">
                  <Sparkles size={20} className="text-blue-100" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100">GIS-SPPG Digital System</span>
            </div>
            
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-4">
               {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-blue-100 font-medium max-w-xl leading-relaxed text-sm lg:text-base opacity-90">
               Selamat datang di pusat kendali pemetaan SPPG. Anda memiliki akses penuh untuk memantau kapasitas produksi dan status alokasi kelompok hari ini.
            </p>
            
            <div className="mt-8 flex gap-4">
               <Link to="/dashboard/mapping" className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-3">
                  <MapIcon size={18} /> Buka Peta Analisis
               </Link>
            </div>
         </div>
         
         <div className="hidden lg:block absolute right-12 bottom-12 opacity-10">
            <Activity size={180} />
         </div>
      </div>

      {/* 3-Column Grid of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Kapasitas Produksi" 
          value={stats.totalCapacity.toLocaleString()} 
          unit="porsi/hari"
          icon={Building2}
          color="text-blue-600"
          bg="bg-blue-50"
          trend="+12%"
          isPositive={true}
        />
        <StatCard 
          label="Total Kelompok" 
          value={stats.totalKelompok} 
          unit="unit terdaftar"
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
          trend="+5"
          isPositive={true}
        />
        <StatCard 
          label="Pending Verifikasi" 
          value={stats.pendingKelompok} 
          unit="perlu review"
          icon={Clock}
          color="text-amber-500"
          bg="bg-amber-50"
          trend="-2"
          isPositive={true}
        />
      </div>

      {/* Bottom Layout - Charts & Quick Actions Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-500/5">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <TrendingUp size={20} className="text-blue-600" /> Performa Alokasi
               </h3>
               <span className="text-[10px] font-black text-slate-400">7 HARI TERAKHIR</span>
            </div>
            <div className="h-64 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center">
               <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Data Visualisasi Segera Hadir</p>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-500/5">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <Activity size={20} className="text-blue-600" /> Aktivitas Terbaru
               </h3>
               <Link to="/dashboard/logs" className="text-[10px] font-black text-blue-600 hover:underline">LIHAT SEMUA</Link>
            </div>
            <div className="space-y-4">
               {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Package size={18} />
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-black text-slate-800">Alokasi Otomatis Dijalankan</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Sistem telah memproses 12 koordinat baru</p>
                     </div>
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">2j yang lalu</p>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit, icon: Icon, color, bg, trend, isPositive }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-500/5 transition-all hover:shadow-blue-500/10 group overflow-hidden relative">
     <div className={`p-4 rounded-2xl transition-all group-hover:rotate-12 absolute -top-2 -right-2 opacity-10 ${bg}`}>
        <Icon className={color} size={80} />
     </div>
     
     <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${bg}`}>
           <Icon className={color} size={24} />
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">{label}</p>
        <div className="flex items-baseline gap-2 mb-4">
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h2>
           <span className="text-xs font-bold text-slate-400">{unit}</span>
        </div>
        
        <div className={`flex items-center gap-2 text-[10px] font-black px-3 py-1 rounded-full w-fit ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
           {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
           {trend}
        </div>
     </div>
  </div>
);

export default StatsOverview;
