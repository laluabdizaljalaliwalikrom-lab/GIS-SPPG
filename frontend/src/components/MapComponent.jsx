import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const getIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const sppgIcon = getIcon('green');
const verifiedSchoolIcon = getIcon('blue');
const verifiedPosyanduIcon = getIcon('orange');
const pendingIcon = getIcon('red');

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

const MapComponent = ({ sppgs, kelompoks, setClickedLocation, isFullScreen }) => {
  const defaultCenter = [-0.789275, 113.921327]; // Indonesia approx center

  const polylines = kelompoks
    .filter(k => k.assigned_sppg_id && k.status === 'verified')
    .map(k => {
      const sppg = sppgs.find(s => s.id === k.assigned_sppg_id);
      if (sppg) {
        return {
          id: k.id,
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
    <MapContainer center={defaultCenter} zoom={5} className="leaflet-container">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents setClickedLocation={setClickedLocation} />
      <ResizeHandler isFullScreen={isFullScreen} />

      {sppgs.map(sppg => (
        <Marker key={`sppg-${sppg.id}`} position={[sppg.lat, sppg.lng]} icon={sppgIcon}>
          <Popup className="rounded-2xl overflow-hidden">
            <div className="p-1">
               <p className="font-bold text-emerald-700 text-sm mb-1">{sppg.nama}</p>
               <p className="text-xs text-slate-500 mb-1">Cap: {sppg.kapasitas_produksi} portions</p>
               <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">{sppg.status_operasional}</span>
            </div>
          </Popup>
        </Marker>
      ))}

      {kelompoks.map(k => {
        let icon = pendingIcon;
        if (k.status === 'verified') {
           icon = k.jenis_kelompok === 'School' ? verifiedSchoolIcon : verifiedPosyanduIcon;
        }

        return (
          <Marker key={`kelompok-${k.id}`} position={[k.lat, k.lng]} icon={icon}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-800 text-sm mb-1">{k.nama}</p>
                <p className="text-xs text-slate-500 mb-2">{k.jenis_kelompok} • {k.jenis_kepemilikan}</p>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Assignment</p>
                  <p className="text-xs font-semibold text-emerald-600">
                    {k.assigned_sppg_id ? sppgs.find(s=>s.id===k.assigned_sppg_id)?.nama : 'Unassigned'}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {polylines.map((line, idx) => (
        <Polyline key={`line-${idx}`} positions={line.positions} color="#10b981" weight={2} opacity={0.6} dashArray="8, 12" />
      ))}
    </MapContainer>
  );
};

export default MapComponent;
