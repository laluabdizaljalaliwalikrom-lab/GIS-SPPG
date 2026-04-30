import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, Tooltip } from 'react-leaflet';
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
  iconSize: [18, 30],
  iconAnchor: [9, 30],
  popupAnchor: [1, -26],
  shadowSize: [30, 30]
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

const MapComponent = ({ sppgs, kelompoks, setClickedLocation, isFullScreen, onMarkerClick }) => {
  const defaultCenter = [-8.625, 116.44]; // Center of Kecamatan Sikur, Lombok Timur

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
    <MapContainer center={defaultCenter} zoom={13} className="leaflet-container">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents setClickedLocation={setClickedLocation} />
      <ResizeHandler isFullScreen={isFullScreen} />

      {sppgs.map(sppg => (
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
        let icon = pendingIcon;
        if (k.status === 'verified') {
           icon = k.jenis_kelompok === 'School' ? verifiedSchoolIcon : verifiedPosyanduIcon;
        }

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

      {polylines.map((line, idx) => (
        <Polyline key={`line-${idx}`} positions={line.positions} color="#10b981" weight={2} opacity={0.6} dashArray="8, 12" />
      ))}
    </MapContainer>
  );
};

export default MapComponent;
