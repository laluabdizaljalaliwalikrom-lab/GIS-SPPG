import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, Tooltip, Popup, GeoJSON } from 'react-leaflet';
import sikurGeoJSON from '../assets/sikur.json';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Target, Layers, Eye, EyeOff } from 'lucide-react';

// Fix for default icons
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

// Modern Marker Creator
const createCustomIcon = (color, type) => {
  const iconHtml = `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 ${color === 'emerald' ? 'bg-emerald-400/30' : color === 'blue' ? 'bg-blue-400/30' : color === 'amber' ? 'bg-amber-400/30' : 'bg-red-400/30'} rounded-full animate-ping"></div>
      <div class="relative w-6 h-6 ${color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-600' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'} rounded-xl shadow-lg border-2 border-white flex items-center justify-center text-white">
        ${type === 'sppg' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M15 18h.01"/><path d="M9 18h.01"/></svg>' :
      type === 'school' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' :
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'}
      </div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const sppgIcon = createCustomIcon('emerald', 'sppg');
const verifiedSchoolIcon = createCustomIcon('blue', 'school');
const verifiedPosyanduIcon = createCustomIcon('amber', 'posyandu');
const pendingIcon = createCustomIcon('red', 'pending');

// Boundary data is now loaded from sikur.json asset

const MapEvents = ({ setClickedLocation }) => {
  useMapEvents({
    click(e) {
      setClickedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const ResizeHandler = ({ isFullScreen }) => {
  const map = useMapEvents({});
  useEffect(() => {
    // Invalidate size when layout changes to fix partial map rendering
    setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 800); // Wait for 700ms CSS transition to finish
  }, [isFullScreen, map]);
  return null;
};

const CustomZoomControl = ({ sppgs, kelompoks }) => {
  const map = useMapEvents({});

  const fitAll = (e) => {
    e.stopPropagation();
    const markers = [
      ...sppgs.map(s => [s.lat, s.lng]),
      ...kelompoks.map(k => [k.lat, k.lng])
    ].filter(pos => pos[0] && pos[1]);

    if (markers.length > 0) {
      map.fitBounds(markers, { padding: [50, 50], animate: true });
    }
  };

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute top-4 left-4 z-[1000] flex flex-col gap-2"
    >
      <button
        onClick={(e) => { e.stopPropagation(); map.zoomIn(); }}
        className="w-8 h-8 lg:w-9 lg:h-9 bg-white/95 backdrop-blur-xl rounded-xl flex items-center justify-center text-slate-700 shadow-xl border border-white/60 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); map.zoomOut(); }}
        className="w-8 h-8 lg:w-9 lg:h-9 bg-white/95 backdrop-blur-xl rounded-xl flex items-center justify-center text-slate-700 shadow-xl border border-white/60 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
      >
        <div className="w-3 h-0.5 bg-current rounded-full" />
      </button>
      <button
        onClick={fitAll}
        title="Focus All Markers"
        className="w-8 h-8 lg:w-9 lg:h-9 bg-white/95 backdrop-blur-xl rounded-xl flex items-center justify-center text-blue-600 shadow-xl border border-white/60 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
      >
        <Target size={16} />
      </button>
    </div>
  );
};

const LayerControl = ({ visibility, setVisibility }) => {
  const [isOpen, setIsOpen] = useState(false);

  const layers = [
    { id: 'sppg', label: 'Unit SPPG', color: 'bg-emerald-500' },
    { id: 'school', label: 'Sekolah (Verified)', color: 'bg-blue-600' },
    { id: 'posyandu', label: 'Posyandu (Verified)', color: 'bg-amber-500' },
    { id: 'pending', label: 'Menunggu Verifikasi', color: 'bg-red-500' },
    { id: 'boundary', label: 'Batas Wilayah', color: 'bg-blue-400' },
    { id: 'lines', label: 'Garis Penugasan', color: 'bg-blue-500/50' },
  ];

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute top-[72px] lg:top-4 right-4 z-[1000] flex flex-col items-end gap-2"
    >
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        title="Map Layers"
        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all shadow-xl border border-white/60 backdrop-blur-xl ${
          isOpen ? 'bg-blue-600 text-white' : 'bg-white/95 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Layers size={isOpen ? 18 : 20} />
      </button>

      {isOpen && (
        <div className="w-56 lg:w-64 bg-white/95 backdrop-blur-2xl rounded-[1.5rem] lg:rounded-[2rem] shadow-2xl border border-white/60 p-4 lg:p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 lg:mb-4 ml-1">Map Layers</p>
          <div className="space-y-1 lg:space-y-2">
            {layers.map(layer => (
              <button
                key={layer.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setVisibility(prev => ({ ...prev, [layer.id]: !prev[layer.id] }));
                }}
                className="w-full flex items-center justify-between p-2.5 lg:p-3 rounded-xl lg:rounded-2xl hover:bg-slate-50 transition-colors group text-left"
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className={`w-2 lg:w-2.5 h-2 lg:h-2.5 rounded-full ${layer.color} shadow-sm`} />
                  <span className={`text-[10px] lg:text-[11px] font-bold ${visibility[layer.id] ? 'text-slate-700' : 'text-slate-400 line-through decoration-2 opacity-50'}`}>
                    {layer.label}
                  </span>
                </div>
                {visibility[layer.id] ? (
                  <Eye size={12} className="text-blue-500 lg:w-[14px] lg:h-[14px]" />
                ) : (
                  <EyeOff size={12} className="text-slate-300 lg:w-[14px] lg:h-[14px]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MapComponent = ({ sppgs = [], kelompoks = [], setClickedLocation, isFullScreen, onMarkerClick }) => {
  const [visibility, setVisibility] = useState({
    sppg: true,
    school: true,
    posyandu: true,
    pending: true,
    boundary: true,
    lines: true
  });
  const defaultCenter = [-8.625, 116.44]; // Center of Kecamatan Sikur, Lombok Timur

  const polylines = kelompoks
    .filter(k => k.assigned_sppg_id && k.status === 'verified')
    .map(k => {
      const sppg = sppgs.find(s => s.id === k.assigned_sppg_id);
      if (sppg) {
        const start = L.latLng(sppg.lat, sppg.lng);
        const end = L.latLng(k.lat, k.lng);
        const distance = start.distanceTo(end);

        return {
          id: k.id,
          sppgName: sppg.nama,
          kelompokName: k.nama,
          distance: (distance / 1000).toFixed(2),
          positions: [
            [sppg.lat, sppg.lng],
            [k.lat, k.lng]
          ]
        };
      }
      return null;
    })
    .filter(Boolean);

  return (
    <MapContainer center={defaultCenter} zoom={13} className="leaflet-container" zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapEvents setClickedLocation={setClickedLocation} />
      <ResizeHandler isFullScreen={isFullScreen} />
      <CustomZoomControl sppgs={sppgs} kelompoks={kelompoks} />
      <LayerControl visibility={visibility} setVisibility={setVisibility} />

      {/* High-Precision Kecamatan Sikur Boundary from GeoJSON with Village Labels */}
      {visibility.boundary && (
        <GeoJSON 
          data={sikurGeoJSON}
          onEachFeature={(feature, layer) => {
            if (feature.properties && (feature.properties.kel_desa || feature.properties.ori_name)) {
              layer.bindTooltip(feature.properties.kel_desa || feature.properties.ori_name, {
                permanent: true,
                direction: 'center',
                className: 'village-label-tooltip',
                sticky: true
              });
            }
          }}
          style={{
            color: '#3b82f6',
            weight: 1.5,
            fillColor: '#3b82f6',
            fillOpacity: 0.04,
            dashArray: '5, 8',
            lineCap: 'round',
            lineJoin: 'round'
          }}
          interactive={false}
        />
      )}

      {visibility.sppg && sppgs.filter(s => s.lat && s.lng).map(sppg => (
        <Marker
          key={`sppg-${sppg.id}`}
          position={[sppg.lat, sppg.lng]}
          icon={sppgIcon}
          eventHandlers={{
            click: () => onMarkerClick(sppg, 'sppg')
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -28]} className="custom-tooltip font-black text-[9px] uppercase tracking-tighter">
            {sppg.nama}
          </Tooltip>
        </Marker>
      ))}

      {kelompoks.map(k => {
        if (!k.lat || !k.lng) return null;
        
        let isVisible = false;
        let icon = pendingIcon;
        
        if (k.status === 'verified') {
          if (k.jenis_kelompok === 'School') {
            isVisible = visibility.school;
            icon = verifiedSchoolIcon;
          } else {
            isVisible = visibility.posyandu;
            icon = verifiedPosyanduIcon;
          }
        } else {
          isVisible = visibility.pending;
          icon = pendingIcon;
        }

        if (!isVisible) return null;

        return (
          <Marker
            key={`kelompok-${k.id}`}
            position={[k.lat, k.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onMarkerClick(k, 'kelompok')
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -28]} className="custom-tooltip font-bold text-[8px] text-slate-600">
              {k.nama}
            </Tooltip>
          </Marker>
        );
      })}

      {visibility.lines && polylines.map((line, idx) => (
        <Polyline
          key={`line-${idx}`}
          positions={line.positions}
          color="#3b82f6"
          weight={6}
          opacity={0.8}
          dashArray="1, 10"
          lineCap="round"
          className="futuristic-line cursor-pointer"
        >
          <Tooltip sticky direction="top" className="custom-tooltip font-black text-[10px] text-blue-600">
            {line.distance} KM
          </Tooltip>
          <Popup>
            <div className="p-3 min-w-[180px]">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Analisis Jarak Distribusi</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Dari SPPG</p>
                  <p className="text-sm font-black text-slate-800">{line.sppgName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <div className="px-2 py-1 bg-blue-50 rounded-lg text-blue-600 font-black text-[10px]">
                    {line.distance} KM
                  </div>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Ke Kelompok</p>
                  <p className="text-sm font-black text-slate-800">{line.kelompokName}</p>
                </div>
              </div>
            </div>
          </Popup>
        </Polyline>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
