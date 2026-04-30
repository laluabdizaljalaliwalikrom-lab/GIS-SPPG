import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  History, 
  User, 
  Calendar, 
  Info,
  Search,
  Filter,
  Database
} from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // We attempt the join, but handle failures gracefully
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Query Error:", error);
        // Fallback: fetch without profiles if join fails
        const { data: simpleData } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false });
        setLogs(simpleData || []);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchLogs();
    };
    init();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => 
    (log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (log.details?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Audit Trail</h1>
           <p className="text-slate-500 font-medium text-sm lg:text-base">Rekaman riwayat aktivitas administratif sistem.</p>
        </div>
        
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari aktivitas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100" />
          ))
        ) : filteredLogs.map((log) => (
          <div key={log.id} className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
             <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                {/* Status Column */}
                <div className="flex items-center gap-4 lg:w-48 shrink-0">
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${getActionColor(log.action)}`}>
                      <History size={20} />
                   </div>
                   <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Action</p>
                      <p className={`text-sm font-black ${getActionTextColor(log.action)}`}>{log.action}</p>
                   </div>
                </div>

                {/* Details Column */}
                <div className="flex-1 min-w-0 border-l border-slate-50 pl-4 lg:pl-8">
                   <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Info size={14} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium text-sm leading-relaxed">{log.details}</p>
                        <div className="flex items-center gap-4 mt-2">
                           <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              <User size={12} />
                              {log.profiles?.full_name || 'System / Auto'}
                           </span>
                           <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              <Calendar size={12} />
                              {new Date(log.created_at).toLocaleString('id-ID')}
                           </span>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Meta Column */}
                <div className="hidden lg:flex flex-col items-end gap-1 shrink-0 px-8 border-l border-slate-50">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-300">
                      <Database size={12} />
                      {log.target_table}
                   </div>
                   <div className="text-[10px] font-mono text-slate-300">ID: {log.target_id}</div>
                </div>
             </div>
          </div>
        ))}
      </div>

      {!loading && filteredLogs.length === 0 && (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Filter size={40} className="text-slate-200" />
           </div>
           <p className="text-slate-400 font-bold">Belum ada catatan aktivitas.</p>
        </div>
      )}
    </div>
  );
};

const getActionColor = (action) => {
  switch (action) {
    case 'CREATE': return 'bg-blue-50 text-blue-600';
    case 'UPDATE': return 'bg-amber-50 text-amber-600';
    case 'DELETE': return 'bg-red-50 text-red-600';
    case 'ALLOCATE': return 'bg-blue-600 text-white';
    case 'VERIFY': return 'bg-emerald-50 text-emerald-600';
    default: return 'bg-slate-50 text-slate-400';
  }
};

const getActionTextColor = (action) => {
  switch (action) {
    case 'CREATE': return 'text-blue-600';
    case 'UPDATE': return 'text-amber-600';
    case 'DELETE': return 'text-red-600';
    case 'ALLOCATE': return 'text-blue-800';
    case 'VERIFY': return 'text-emerald-600';
    default: return 'text-slate-500';
  }
};

export default AuditLogs;
