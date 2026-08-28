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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-header">Audit Trail</h1>
          <p className="page-subtitle">Rekaman riwayat aktivitas administratif sistem.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Cari aktivitas..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-slate-200" />
          ))
        ) : filteredLogs.map((log) => (
          <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 sm:w-44 shrink-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getActionColor(log.action)}`}>
                  <History size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Action</p>
                  <p className={`text-sm font-semibold ${getActionTextColor(log.action)}`}>{log.action}</p>
                </div>
              </div>

              <div className="flex-1 min-w-0 sm:border-l sm:border-slate-100 sm:pl-4">
                <div className="flex items-start gap-2">
                  <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-600 leading-relaxed">{log.details}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <User size={11} />{log.profiles?.full_name || 'System / Auto'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={11} />{new Date(log.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-end gap-1 shrink-0 pl-4 border-l border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Database size={11} />{log.target_table}
                </div>
                <div className="text-[10px] font-mono text-slate-300">ID: {log.target_id}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && filteredLogs.length === 0 && (
        <div className="py-20 text-center bg-white rounded-xl border border-slate-200">
          <div className="empty-state"><Filter size={22} className="text-slate-300" /></div>
          <p className="text-sm font-medium text-slate-400">Belum ada catatan aktivitas.</p>
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
