import { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import api from '../api';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Play, RefreshCw, Layers, Crosshair } from 'lucide-react';

const MapView = () => {
  const { profile } = useOutletContext();
  const navigate = useNavigate();
  const [sppgs, setSppgs] = useState([]);
  const [kelompoks, setKelompoks] = useState([]);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const sppgRes = await api.get('/sppg');
      const kelompokRes = await api.get('/kelompok');
      setSppgs(sppgRes.data);
      setKelompoks(kelompokRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      await fetchData();
    };
    initFetch();
  }, []);

  const handleAutoAllocate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/allocate');
      alert(`Auto-Allocation complete! Assigned ${res.data.assigned_count} groups.`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error running allocation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Spatial Analysis</h1>
           <p className="text-slate-500 mt-1">Sistem Pemetaan Satuan Pelayanan Gizi</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw size={20} />
          </button>
          
          {(profile?.role === 'admin') && (
            <button 
              onClick={handleAutoAllocate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
              Run Allocation
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
        <MapComponent 
            sppgs={sppgs} 
            kelompoks={kelompoks} 
            setClickedLocation={setClickedLocation} 
        />
        
        {/* Floating Panels */}
        <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3 pointer-events-none">
          <div className="glass-panel p-4 rounded-2xl pointer-events-auto w-64">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Layers size={18} className="text-emerald-600" /> Map Legend
            </h3>
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
                  <span className="text-sm font-medium text-slate-600">SPPG Units</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                  <span className="text-sm font-medium text-slate-600">School (Verified)</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm" />
                  <span className="text-sm font-medium text-slate-600">Posyandu (Verified)</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-400 border-2 border-white shadow-sm" />
                  <span className="text-sm font-medium text-slate-600">Pending Verification</span>
               </div>
            </div>
          </div>

          {clickedLocation && (
             <div className="glass-panel p-4 rounded-2xl pointer-events-auto w-64 animate-in slide-in-from-left-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Crosshair size={18} className="text-red-500" /> Selected Point
                </h3>
                <p className="text-xs text-slate-500 mb-1">Lat: {clickedLocation.lat.toFixed(6)}</p>
                <p className="text-xs text-slate-500 mb-3">Lng: {clickedLocation.lng.toFixed(6)}</p>
                <div className="flex gap-2">
                   <button 
                     onClick={() => navigate('/kelompok')}
                     className="flex-1 py-2 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-200 transition-all"
                   >
                     Add Kelompok
                   </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
