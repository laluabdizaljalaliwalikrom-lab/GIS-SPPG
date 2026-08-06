import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useQueryClient } from '@tanstack/react-query';
import { useSPPG } from '../hooks/useSPPG';
import { useKelompok } from '../hooks/useKelompok';
import MapComponent from '../components/MapComponent';
import { useOutletContext, useNavigate } from 'react-router-dom';
import EntityDetailDrawer from '../components/EntityDetailDrawer';
import { 
  RefreshCw, 
  Crosshair,
  Plus, 
  X, 
  Maximize2, 
  Minimize2, 
  Building2, 
  Map as MapIcon,
  ChevronRight,
  Search,
  Activity,
  CheckCircle2,
  AlertCircle,
  School,
  HeartPulse,
  Navigation
} from 'lucide-react';

const MapView = () => {
  const queryClient = useQueryClient();
  const { profile } = useOutletContext();
  const navigate = useNavigate();
  
  const [clickedLocation, setClickedLocation] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarTab, setSidebarTab] = useState('sppg'); // 'sppg' | 'kelompok'
  
  const mobileFullBtnRef = useRef(null);

  useEffect(() => {
    if (mobileFullBtnRef.current) {
      L.DomEvent.disableClickPropagation(mobileFullBtnRef.current);
    }
  }, []);

  // Drawer State
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // TanStack Query Hooks
  const { sppgs = [], isLoading: loadingSPPG } = useSPPG();
  const { kelompoks = [], isLoading: loadingKelompok } = useKelompok();

  const loading = loadingSPPG || loadingKelompok;

  const handleEntityClick = (entity, type) => {
    setSelectedEntity({ ...entity, type });
    setIsDrawerOpen(true);
    if (entity.lat && entity.lng) {
      setFlyToTarget({ lat: entity.lat, lng: entity.lng });
    }
  };

  const handleSidebarItemClick = (item, type) => {
    if (item.lat && item.lng) {
      setFlyToTarget({ lat: item.lat, lng: item.lng });
    }
    handleEntityClick(item, type);
  };

  const filteredSppgs = sppgs.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.alamat_desa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.kode_sppg?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredKelompoks = kelompoks.filter(k => 
    k.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    k.alamat_desa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.kode_kelompok?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aggregates
  const totalSchools = kelompoks.filter(k => k.jenis_kelompok === 'School' && k.status === 'verified').length;
  const totalPosyandu = kelompoks.filter(k => k.jenis_kelompok === 'Posyandu' && k.status === 'verified').length;
  const pendingCount = kelompoks.filter(k => k.status === 'pending_verification').length;

  return (
    <div className="fixed inset-0 lg:static lg:h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-700 lg:p-6 lg:pl-10">
      
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 lg:p-0 lg:mb-5 z-40 bg-white/90 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none border-b border-blue-100 lg:border-0 shadow-sm lg:shadow-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200 lg:hidden">
            <MapIcon className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg lg:text-2xl font-black text-slate-800 tracking-tight leading-tight flex items-center gap-2">
              Peta GIS Interaktif
              <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                Sikur
              </span>
            </h1>
            <p className="hidden lg:block text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-0.5">
              Pemetaan Geografis SPPG & Penerima Manfaat Satuan Pangan Gizi
            </p>
          </div>
        </div>

        {/* Quick Stat Badges & Controls */}
        <div className="flex items-center justify-between lg:justify-end gap-2 overflow-x-auto no-scrollbar">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[10px] font-black uppercase tracking-wider shadow-sm">
              <Building2 size={13} className="text-emerald-600" />
              <span>{sppgs.length} SPPG</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-[10px] font-black uppercase tracking-wider shadow-sm">
              <School size={13} className="text-blue-600" />
              <span>{totalSchools} Sekolah</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-[10px] font-black uppercase tracking-wider shadow-sm">
              <HeartPulse size={13} className="text-amber-600" />
              <span>{totalPosyandu} Posyandu</span>
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                <AlertCircle size={13} className="text-rose-600" />
                <span>{pendingCount} Pending</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['sppgs'] });
                queryClient.invalidateQueries({ queryKey: ['kelompoks'] });
              }}
              title="Refresh Data Peta"
              className="p-2.5 bg-white border border-slate-200 hover:border-blue-300 rounded-xl text-slate-600 hover:bg-blue-50 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 rounded-xl font-bold text-xs shadow-sm hover:bg-blue-50 transition-all active:scale-95 cursor-pointer"
            >
              {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullScreen ? 'Split View' : 'Layar Penuh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map & Sidebar Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-5 min-h-0 overflow-hidden relative">
        
        {/* Leaflet Map Wrapper */}
        <div className={`relative transition-all duration-700 ease-in-out bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200/80 shadow-2xl shadow-slate-500/5 overflow-hidden group ${isFullScreen ? 'lg:w-full' : 'lg:w-2/3'} flex-1 h-full`}>
          <MapComponent 
            sppgs={sppgs} 
            kelompoks={kelompoks} 
            setClickedLocation={setClickedLocation} 
            isFullScreen={isFullScreen}
            onMarkerClick={(entity, type) => handleEntityClick(entity, type)}
            flyToTarget={flyToTarget}
          />
          
          <button 
            ref={mobileFullBtnRef}
            onClick={(e) => { e.stopPropagation(); setIsFullScreen(!isFullScreen); }}
            className="lg:hidden absolute top-3 right-3 z-[1000] p-2.5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 text-blue-600"
            aria-label="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {/* Dynamic Sidebar Panel */}
        {!isFullScreen && (
          <aside className="hidden lg:flex lg:w-1/3 flex-col gap-4 animate-in slide-in-from-right-10 duration-700 overflow-hidden pb-24 lg:pb-0">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/80 shadow-2xl shadow-slate-500/5 p-5 flex flex-col h-full overflow-hidden">
              
              {/* Tab Selector Header */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 mb-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setSidebarTab('sppg')}
                  className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    sidebarTab === 'sppg'
                      ? 'bg-white text-emerald-700 shadow-md shadow-emerald-500/10 border border-emerald-100'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 size={14} />
                  <span>SPPG ({sppgs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab('kelompok')}
                  className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    sidebarTab === 'kelompok'
                      ? 'bg-white text-blue-700 shadow-md shadow-blue-500/10 border border-blue-100'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity size={14} />
                  <span>Kelompok ({kelompoks.length})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={sidebarTab === 'sppg' ? "Cari unit SPPG atau desa..." : "Cari kelompok / sekolah..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {sidebarTab === 'sppg' ? (
                  /* SPPG List */
                  loading && filteredSppgs.length === 0 ? (
                    [1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />)
                  ) : filteredSppgs.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Search size={20} className="text-slate-300" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Unit SPPG tidak ditemukan</p>
                    </div>
                  ) : (
                    filteredSppgs.map(sppg => (
                      <div 
                        key={sppg.id} 
                        onClick={() => handleSidebarItemClick(sppg, 'sppg')}
                        className="p-4.5 rounded-3xl border border-slate-100 bg-white hover:bg-emerald-50/40 hover:border-emerald-200/80 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md border border-emerald-100 uppercase tracking-wider">
                                {sppg.kode_sppg || 'SPPG'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{sppg.alamat_desa}</span>
                            </div>
                            <p className="font-black text-slate-800 text-sm group-hover:text-emerald-700 transition-colors truncate">{sppg.nama}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                            <Navigation size={14} />
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Kapasitas Produksi</span>
                          <span className="text-emerald-700 font-black">{sppg.kapasitas_produksi} Porsi/Hari</span>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  /* Kelompok List */
                  loading && filteredKelompoks.length === 0 ? (
                    [1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse" />)
                  ) : filteredKelompoks.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Search size={20} className="text-slate-300" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Kelompok tidak ditemukan</p>
                    </div>
                  ) : (
                    filteredKelompoks.map(kel => (
                      <div 
                        key={kel.id} 
                        onClick={() => handleSidebarItemClick(kel, 'kelompok')}
                        className="p-4.5 rounded-3xl border border-slate-100 bg-white hover:bg-blue-50/40 hover:border-blue-200/80 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider border ${
                                kel.status === 'verified'
                                  ? kel.jenis_kelompok === 'School' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {kel.jenis_kelompok || 'Kelompok'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{kel.alamat_desa}</span>
                            </div>
                            <p className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate">{kel.nama}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                            <Navigation size={14} />
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Penerima Manfaat</span>
                          <span className="text-blue-700 font-black">{kel.jumlah_penerima || 0} Jiwa</span>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>

            </div>
          </aside>
        )}
      </div>

      {/* Floating Card for Map Clicked Location */}
      {clickedLocation && (
        <div className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-[1000] bg-white/95 backdrop-blur-xl p-6 rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-blue-100 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Crosshair size={18} className="text-rose-500" /> Koordinat Terpilih
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">LOKASI DI PETA SIKUR</p>
            </div>
            <button 
              type="button"
              onClick={() => setClickedLocation(null)} 
              className="p-1.5 bg-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
              aria-label="Tutup"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Latitude</p>
              <p className="text-xs font-mono font-bold text-slate-800">{clickedLocation.lat.toFixed(6)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Longitude</p>
              <p className="text-xs font-mono font-bold text-slate-800">{clickedLocation.lng.toFixed(6)}</p>
            </div>
          </div>

          {(profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator') && (
            <button 
              type="button"
              onClick={() => navigate(`/dashboard/kelompok?lat=${clickedLocation.lat}&lng=${clickedLocation.lng}&add=true`)}
              className="w-full py-3 bg-blue-600 text-white text-xs font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <Plus size={16} />
              Tambah Kelompok Di Sini
            </button>
          )}
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
