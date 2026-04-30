import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSPPG } from '../hooks/useSPPG';
import { useKelompok } from '../hooks/useKelompok';
import MapComponent from '../components/MapComponent';
import { useOutletContext, useNavigate } from 'react-router-dom';
import EntityDetailDrawer from '../components/EntityDetailDrawer';
import { 
  RefreshCw, 
  Layers, 
  Crosshair, 
  Plus, 
  X, 
  Maximize2, 
  Minimize2, 
  Building2, 
  Map as MapIcon,
  ChevronRight,
  Search
} from 'lucide-react';

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-3 px-1">
     <div className={`w-3 h-3 rounded-full ${color} ring-4 ring-white shadow-sm shrink-0`} />
     <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{label}</span>
  </div>
);

const MapView = () => {
  const queryClient = useQueryClient();
  const { profile } = useOutletContext();
  const navigate = useNavigate();
  const [clickedLocation, setClickedLocation] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer State
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // TanStack Query Hooks
  const { sppgs, isLoading: loadingSPPG } = useSPPG();
  const { kelompoks, isLoading: loadingKelompok } = useKelompok();

  const loading = loadingSPPG || loadingKelompok;

  const handleEntityClick = (entity, type) => {
    setSelectedEntity({ ...entity, type });
    setIsDrawerOpen(true);
  };

  const filteredSppgs = sppgs.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.alamat_desa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 lg:static lg:h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-700 lg:p-8 lg:pl-12">
      {/* Top Header Section */}
      <div className="flex items-center justify-between p-3 lg:p-0 lg:mb-6 z-40 bg-white/80 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none border-b border-blue-100 lg:border-0 shadow-sm lg:shadow-none shrink-0">
        <div className="flex items-center gap-4">
           <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200 lg:hidden">
              <MapIcon className="text-white" size={20} />
           </div>
           <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight leading-tight">Peta Analisis</h1>
              <p className="hidden lg:block text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-0.5">Sistem Pemetaan SPPG Digital</p>
           </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
          <button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['sppgs'] });
              queryClient.invalidateQueries({ queryKey: ['kelompoks'] });
            }}
            title="Refresh Data"
            className="p-2.5 bg-white border border-blue-100 rounded-xl text-slate-600 hover:bg-blue-50 shadow-sm transition-all active:scale-95"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-100 text-slate-700 rounded-xl font-bold text-xs shadow-sm hover:bg-blue-50 transition-all active:scale-95"
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullScreen ? 'Split View' : 'Full Map'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 overflow-hidden relative">
        <div className={`relative transition-all duration-700 ease-in-out bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-blue-100 shadow-2xl shadow-blue-500/5 overflow-hidden group ${isFullScreen ? 'lg:w-full' : 'lg:w-2/3'} flex-1 h-full`}>
          <MapComponent 
              sppgs={sppgs} 
              kelompoks={kelompoks} 
              setClickedLocation={setClickedLocation} 
              isFullScreen={isFullScreen}
              onMarkerClick={(entity, type) => handleEntityClick(entity, type)}
          />
          
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="lg:hidden absolute top-4 right-4 z-[1000] p-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 text-blue-600"
          >
            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <div className="absolute bottom-32 lg:bottom-8 left-4 right-auto z-[1000] flex flex-col gap-3 pointer-events-none">
            {showLegend && (
              <div className="bg-white/95 backdrop-blur-xl p-4 lg:p-5 rounded-[2rem] pointer-events-auto w-fit lg:w-64 shadow-2xl border border-white/60 animate-in slide-in-from-bottom-10 lg:slide-in-from-left-10 duration-500">
                <div className="flex items-center justify-between mb-3 lg:mb-4 px-1">
                  <h3 className="font-black text-slate-800 flex items-center gap-3 text-[8px] lg:text-[9px] uppercase tracking-[0.2em]">
                    <Layers size={14} className="text-blue-600" /> Legenda Peta
                  </h3>
                  <button onClick={() => setShowLegend(false)} className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3">
                   <LegendItem color="bg-emerald-500" label="Unit SPPG" />
                   <LegendItem color="bg-blue-600" label="Sekolah" />
                   <LegendItem color="bg-amber-500" label="Posyandu" />
                   <LegendItem color="bg-red-400" label="Menunggu" />
                </div>
              </div>
            )}

            {!showLegend && (
              <button 
                onClick={() => setShowLegend(true)}
                className="pointer-events-auto w-10 h-10 lg:w-12 lg:h-12 bg-white/95 backdrop-blur-xl rounded-2xl flex items-center justify-center text-blue-600 shadow-xl border border-white/60 hover:scale-110 transition-all animate-in zoom-in-50"
              >
                <Layers size={20} />
              </button>
            )}
          </div>
        </div>

        {!isFullScreen && (
          <aside className="hidden lg:flex lg:w-1/3 flex-col gap-4 animate-in slide-in-from-right-10 duration-700 overflow-hidden pb-24 lg:pb-0">
             <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-blue-100 shadow-2xl shadow-blue-500/5 p-6 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="font-black text-slate-800 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em]">
                    <Building2 size={18} className="text-blue-600" /> Data Unit SPPG
                  </h3>
                  <div className="bg-blue-50 px-3 py-1 rounded-full text-[10px] font-black text-blue-600 border border-blue-100">
                    {sppgs.length} UNITS
                  </div>
                </div>

                <div className="relative mb-6 shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari unit atau desa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                   {loading && filteredSppgs.length === 0 ? (
                      [1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />)
                   ) : filteredSppgs.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                           <Search size={20} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Unit tidak ditemukan</p>
                      </div>
                   ) : filteredSppgs.map(sppg => (
                     <div 
                        key={sppg.id} 
                        onClick={() => handleEntityClick(sppg, 'sppg')}
                        className="p-5 rounded-3xl border border-slate-100 bg-white hover:bg-blue-50/50 hover:border-blue-100 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                           <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate">{sppg.nama}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{sppg.alamat_desa}</p>
                              </div>
                           </div>
                           <div className="bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                              <ChevronRight size={14} />
                           </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-50">
                           <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                              <span>Kapasitas Produksi</span>
                              <span className="text-blue-600">{sppg.kapasitas_produksi} PORSI</span>
                           </div>
                           <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.3)] transition-all duration-1000" 
                                style={{ width: '70%' }}
                              />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </aside>
        )}
      </div>

      {clickedLocation && (
         <div className="fixed bottom-24 lg:bottom-10 left-4 right-4 lg:left-auto lg:right-10 z-[1000] bg-white/95 backdrop-blur-xl p-8 rounded-[3rem] w-auto lg:w-80 shadow-[0_40px_80px_rgba(37,99,235,0.25)] border border-blue-100 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-black text-slate-800 flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                  <Crosshair size={20} className="text-red-500" /> Koordinat Baru
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">LOKASI TERPILIH DI PETA</p>
              </div>
              <button onClick={() => setClickedLocation(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitude</p>
                 <p className="text-xs font-mono font-bold text-slate-700">{clickedLocation.lat.toFixed(6)}</p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitude</p>
                 <p className="text-xs font-mono font-bold text-slate-700">{clickedLocation.lng.toFixed(6)}</p>
              </div>
            </div>

            <button 
              onClick={() => navigate(`/dashboard/kelompok?lat=${clickedLocation.lat}&lng=${clickedLocation.lng}&add=true`)}
              className="w-full py-4 bg-blue-600 text-white text-[10px] font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em]"
            >
              <Plus size={18} />
              Tambah Kelompok
            </button>
         </div>
      )}

      {/* Detail Drawer Integration */}
      <EntityDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        entity={selectedEntity}
        type={selectedEntity?.type}
        profile={profile}
      />
    </div>
  );
};

export default MapView;
