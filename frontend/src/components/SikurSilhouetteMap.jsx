import { useMemo, useState } from 'react';
import sikurGeoJson from '../assets/sikur.json';
import { MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SikurSilhouetteMap = ({ selectedVillage, onSelectVillage }) => {
  const [hoveredVillage, setHoveredVillage] = useState(null);

  // Compute SVG ViewBox projection bounds from GeoJSON coordinates
  const { paths, viewBox } = useMemo(() => {
    const svgWidth = 600;
    const svgHeight = 450;
    const padding = 30;

    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    // First pass: find bounding box
    sikurGeoJson.features.forEach(feat => {
      const geom = feat.geometry;
      const rings = geom.type === 'MultiPolygon' 
        ? geom.coordinates.flatMap(poly => poly) 
        : geom.coordinates;

      rings.forEach(ring => {
        ring.forEach(([lng, lat]) => {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      });
    });

    const lngSpan = maxLng - minLng || 1;
    const latSpan = maxLat - minLat || 1;

    // Second pass: convert coordinates to SVG path string
    const featurePaths = sikurGeoJson.features.map(feat => {
      const villageName = feat.properties.kel_desa;
      const geom = feat.geometry;
      const multiPolys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];

      const pathData = multiPolys.map(poly => {
        return poly.map(ring => {
          const points = ring.map(([lng, lat]) => {
            const x = padding + ((lng - minLng) / lngSpan) * (svgWidth - 2 * padding);
            const y = svgHeight - (padding + ((lat - minLat) / latSpan) * (svgHeight - 2 * padding));
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          return `M ${points.join(' L ')} Z`;
        }).join(' ');
      }).join(' ');

      return {
        name: villageName,
        path: pathData
      };
    });

    return {
      paths: featurePaths,
      viewBox: `0 0 ${svgWidth} ${svgHeight}`
    };
  }, []);

  const activeName = hoveredVillage || selectedVillage;

  return (
    <div className="relative bg-slate-950/90 rounded-[2.5rem] p-6 sm:p-8 border border-slate-800 shadow-2xl overflow-hidden group">
      
      {/* Background Radial Glow */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Label */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
            <MapPin size={16} />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight">Siluet Batas Vektor Kecamatan Sikur</h4>
            <p className="text-[10px] text-slate-400 font-medium">Render Spasial GIS 14 Desa — GeoJSON SRID 4326</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-blue-300 bg-blue-900/40 px-3 py-1 rounded-full border border-blue-700/50">
          <Sparkles size={12} className="text-blue-400" /> Vector Render Active
        </div>
      </div>

      {/* SVG Silhouette Render Canvas */}
      <div className="relative z-10 w-full aspect-[4/3] flex items-center justify-center my-2">
        <svg
          viewBox={viewBox}
          className="w-full h-full max-h-[380px] drop-shadow-[0_10px_25px_rgba(37,99,235,0.2)]"
        >
          <defs>
            {/* Linear Glow Gradients */}
            <linearGradient id="normalVillageGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="activeVillageGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Render All 14 Village Boundaries */}
          {paths.map((item) => {
            const isHovered = hoveredVillage === item.name;
            const isSelected = selectedVillage === item.name;
            const isActive = isHovered || isSelected;

            return (
              <g key={item.name} className="cursor-pointer">
                <path
                  d={item.path}
                  fill={isActive ? 'url(#activeVillageGlow)' : 'url(#normalVillageGlow)'}
                  stroke={isActive ? '#60a5fa' : '#334155'}
                  strokeWidth={isActive ? '2.5' : '1.2'}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredVillage(item.name)}
                  onMouseLeave={() => setHoveredVillage(null)}
                  onClick={() => onSelectVillage && onSelectVillage(item.name)}
                  className="transition-all duration-300 hover:brightness-125"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover / Active Floating Tooltip Badge */}
        <AnimatePresence>
          {activeName && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-blue-500/50 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none z-30"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <div>
                <p className="text-xs font-black tracking-tight text-white">{activeName}</p>
                <p className="text-[10px] text-blue-300 font-medium">Wilayah Desa Resmi — Kec. Sikur</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Silhouette Legend Footer */}
      <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-950 border border-slate-700" />
            <span>Batas Wilayah Desa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 border border-blue-400" />
            <span>Desa Terpilih</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-500">14 Features Parsed</span>
      </div>

    </div>
  );
};

export default SikurSilhouetteMap;
