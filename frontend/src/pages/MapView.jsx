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
    <div className="fixed inset-0 lg:static lg:h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-300 lg:p-5">
      
      {/* Top Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 lg:p-0 lg:mb-4 z-40 bg-white lg:bg-transparent border-b border-slate-200 lg:border-0 shadow-sm lg:shadow-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm text-white lg:hidden">
            <MapIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header text-lg lg:text-xl">Peta GIS Interaktif</h1>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                Kec. Sikur
              </span>
            </div>
            <p className="hidden lg:block text-slate-500 font-medium text-xs mt-0.5">
              Pemetaan Geografis SPPG & Kelompok Penerima Manfaat Gizi
            </p>
          </div>
        </div>

        {/* Quick Stat Badges & Controls */}
        <div className="flex items-center justify-between lg:justify-end gap-2 overflow-x-auto no-scrollbar">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-xs font-medium">
              <Building2 size={13} className="text-emerald-600" />
              <span>{sppgs.length} SPPG</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs font-medium">
              <School size={13} className="text-blue-600" />
              <span>{totalSchools} Sekolah</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs font-medium">
              <HeartPulse size={13} className="text-amber-600" />
              <span>{totalPosyandu} Posyandu</span>
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs font-medium animate-pulse">
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
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs shadow-sm transition-all cursor-pointer"
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullScreen ? 'Split View' : 'Layar Penuh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map & Sidebar Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden relative">
        
        {/* Leaflet Map Wrapper */}
        <div className={`relative transition-all duration-500 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group ${isFullScreen ? 'lg:w-full' : 'lg:w-2/3'} flex-1 h-full`}>
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
            className="lg:hidden absolute top-3 right-3 z-[1000] p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200 text-blue-600"
            aria-label="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Dynamic Sidebar Panel */}
        {!isFullScreen && (
          <aside className="hidden lg:flex lg:w-1/3 flex-col gap-4 animate-in slide-in-from-right-4 duration-300 overflow-hidden pb-24 lg:pb-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-full overflow-hidden">
              
              {/* Tab Selector Header */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSidebarTab('sppg')}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    sidebarTab === 'sppg'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 size={14} />
                  <span>SPPG ({sppgs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab('kelompok')}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    sidebarTab === 'kelompok'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity size={14} />
                  <span>Kelompok ({kelompoks.length})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mb-3 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input 
                  type="text" 
                  placeholder={sidebarTab === 'sppg' ? "Cari SPPG atau desa..." : "Cari kelompok / sekolah..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                {sidebarTab === 'sppg' ? (
                  /* SPPG List */
                  loading && filteredSppgs.length === 0 ? (
                    [1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse" />)
                  ) : filteredSppgs.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Search size={18} />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Unit SPPG tidak ditemukan</p>
                    </div>
                  ) : (
                    filteredSppgs.map(sppg => (
                      <div 
                        key={sppg.id} 
                        onClick={() => handleSidebarItemClick(sppg, 'sppg')}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded border border-emerald-200">
                                {sppg.kode_sppg || 'SPPG'}
                              </span>
                              <span className="text-xs text-slate-400 truncate">{sppg.alamat_desa}</span>
                            </div>
                            <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate">{sppg.nama}</p>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                            <Navigation size={13} />
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Kapasitas</span>
                          <span className="text-slate-700 font-semibold">{sppg.kapasitas_produksi?.toLocaleString()} Porsi/Hari</span>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  /* Kelompok List */
                  loading && filteredKelompoks.length === 0 ? (
                    [1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse" />)
                  ) : filteredKelompoks.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Search size={18} />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Kelompok tidak ditemukan</p>
                    </div>
                  ) : (
                    filteredKelompoks.map(kel => (
                      <div 
                        key={kel.id} 
                        onClick={() => handleSidebarItemClick(kel, 'kelompok')}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${
                                kel.status === 'verified'
                                  ? kel.jenis_kelompok === 'School' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {kel.jenis_kelompok || 'Kelompok'}
                              </span>
                              <span className="text-xs text-slate-400 truncate">{kel.alamat_desa}</span>
                            </div>
                            <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate">{kel.nama}</p>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                            <Navigation size={13} />
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Penerima</span>
                          <span className="text-slate-700 font-semibold">{kel.jumlah_penerima || 0} Jiwa</span>
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
        <div className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-[1000] bg-white p-5 rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                <Crosshair size={16} className="text-rose-500" /> Koordinat Terpilih
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Lokasi di peta Kecamatan Sikur</p>
            </div>
            <button 
              type="button"
              onClick={() => setClickedLocation(null)} 
              className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Tutup"
            >
              <X size={15} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <p className="text-[10px] font-medium text-slate-400 mb-0.5">Latitude</p>
              <p className="text-xs font-mono font-semibold text-slate-800">{clickedLocation.lat.toFixed(6)}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <p className="text-[10px] font-medium text-slate-400 mb-0.5">Longitude</p>
              <p className="text-xs font-mono font-semibold text-slate-800">{clickedLocation.lng.toFixed(6)}</p>
            </div>
          </div>

          {(profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator') && (
            <button 
              type="button"
              onClick={() => navigate(`/dashboard/kelompok?lat=${clickedLocation.lat}&lng=${clickedLocation.lng}&add=true`)}
              className="btn-primary w-full text-xs"
            >
              <Plus size={15} />
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

