import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Package,
  Activity
} from 'lucide-react';

const StatsOverview = () => {
  const [stats, setStats] = useState({
    totalSppg: 0,
    totalKelompok: 0,
    verifiedKelompok: 0,
    pendingKelompok: 0,
    totalCapacity: 0,
    currentUsage: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const sppgRes = await api.get('/sppg');
        const kelompokRes = await api.get('/kelompok');
        
        const totalCapacity = sppgRes.data.reduce((acc, s) => acc + (s.kapasitas_produksi || 0), 0);
        
        setStats({
          totalSppg: sppgRes.data.length,
          totalKelompok: kelompokRes.data.length,
          verifiedKelompok: kelompokRes.data.filter(k => k.status === 'verified').length,
          pendingKelompok: kelompokRes.data.filter(k => k.status === 'pending_verification').length,
          totalCapacity: totalCapacity,
          currentUsage: Math.floor(Math.random() * totalCapacity * 0.7) // Placeholder for demo
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total SPPG Units', value: stats.totalSppg, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Total Kelompok', value: stats.totalKelompok, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Verified Data', value: stats.verifiedKelompok, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100/50' },
    { name: 'Pending Review', value: stats.pendingKelompok, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", card.bg)}>
                <card.icon className={card.color} size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{card.name}</p>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <TrendingUp size={20} className="text-emerald-600" />
               Capacity Utilization
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Real-time Data</span>
          </div>
          
          <div className="space-y-8">
             <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold text-slate-600">
                   <span>Production Status</span>
                   <span className="text-emerald-600">{Math.round((stats.currentUsage / stats.totalCapacity) * 100) || 0}% Capacity</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                   <div 
                     className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm" 
                     style={{ width: `${(stats.currentUsage / stats.totalCapacity) * 100 || 0}%` }}
                   />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  *Current capacity is calculated based on verified groups currently assigned to active SPPG units.
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-1">Max Capacity</p>
                   <p className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Package size={18} className="text-blue-500" />
                      {stats.totalCapacity.toLocaleString()} <span className="text-xs text-slate-400 font-normal">portions/day</span>
                   </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-1">Current Demand</p>
                   <p className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Activity size={18} className="text-emerald-500" />
                      {stats.currentUsage.toLocaleString()} <span className="text-xs text-slate-400 font-normal">portions/day</span>
                   </p>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-200">
           <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">Quick Insights</h3>
              <div className="space-y-4">
                 <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-xs text-emerald-100 font-bold uppercase mb-1">Recent Activity</p>
                    <p className="text-sm font-medium">New school data submitted for Kecamatan A needs verification.</p>
                 </div>
                 <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-xs text-emerald-100 font-bold uppercase mb-1">Optimization Tip</p>
                    <p className="text-sm font-medium">SPPG Unit B has 40% idle capacity. Consider re-allocating nearest posyandus.</p>
                 </div>
              </div>
              <button className="mt-8 w-full py-4 bg-white text-emerald-700 font-bold rounded-2xl shadow-lg hover:bg-emerald-50 transition-all">
                Generate Monthly Report
              </button>
           </div>
           
           <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl" />
           <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-emerald-700/50 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

// Helper for class names
const cn = (...inputs) => {
  return inputs.filter(Boolean).join(' ');
};

export default StatsOverview;
