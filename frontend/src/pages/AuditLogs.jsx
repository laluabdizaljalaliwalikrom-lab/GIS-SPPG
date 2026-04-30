import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  History, 
  User, 
  Calendar, 
  Info,
  Search
} from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      // In a real app, we'd fetch from audit_logs table
      // Since we just set it up, let's try to fetch what's there
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
        console.error(error);
      } else {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">System Audit Trail</h1>
           <p className="text-slate-500 mt-1">Rekaman riwayat aktivitas administratif sistem.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-48">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-40">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium">
                     <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300" />
                        {new Date(log.created_at).toLocaleString()}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2 font-bold text-slate-700">
                        <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center text-[10px] text-slate-400">
                           <User size={12} />
                        </div>
                        {log.profiles?.full_name || 'System'}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getActionStyle(log.action)}`}>
                        {log.action}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2 text-slate-600">
                        <Info size={14} className="text-slate-300 shrink-0" />
                        <span className="truncate max-w-md">{log.details}</span>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
             <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
             <p className="font-medium">Fetching logs...</p>
          </div>
        )}

        {!loading && filteredLogs.length === 0 && (
          <div className="p-12 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <History size={32} />
             </div>
             <p className="text-slate-400 font-medium italic">No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const getActionStyle = (action) => {
  switch (action) {
    case 'CREATE': return 'bg-emerald-50 text-emerald-600';
    case 'UPDATE': return 'bg-blue-50 text-blue-600';
    case 'DELETE': return 'bg-red-50 text-red-600';
    case 'ALLOCATE': return 'bg-amber-50 text-amber-600';
    case 'VERIFY': return 'bg-purple-50 text-purple-600';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export default AuditLogs;
