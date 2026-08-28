import { useState, useEffect, useRef } from 'react';
import {
  Building2, Users, Target, Sparkles, Map as MapIcon,
  Activity, ChevronRight, Cpu, CircleDot, GroupIcon,
  Orbit, Radar
} from 'lucide-react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';

function useAnimatedNumber(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const startTime = performance.now();
    prevTarget.current = target;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const StatCard = ({ icon: Icon, label, value, sub, iconBg, iconColor, badge }) => {
  const animVal = useAnimatedNumber(value);
  return (
    <motion.div variants={item}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={17} className={iconColor} />
          </div>
          {badge && <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{badge}</span>}
        </div>
        <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{animVal.toLocaleString()}</span>
          {sub && <span className="text-xs text-slate-400">{sub}</span>}
        </div>
      </div>
    </motion.div>
  );
};

// Keep old for compat but not used
const GradientStatCard = StatCard;

const MiniDonut = ({ percent, color }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="transform -rotate-90">
      <circle cx={36} cy={36} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
      <motion.circle
        cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </svg>
  );
};

const ScoreRing = ({ score, size = 48 }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={3} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.22} fontWeight={800} fontFamily="'Plus Jakarta Sans',sans-serif">
        {Math.round(score)}
      </text>
    </svg>
  );
};

const StatsOverview = () => {
  const { profile } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const sppgCovered = data ? Math.round((data.kelompok_terlayani / Math.max(data.total_kelompok, 1)) * 100) : 0;
  const aktifPct = data ? Math.round((data.sppg_aktif / Math.max(data.total_sppg, 1)) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-40 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-56 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* ─── HERO ─── */}
      <motion.div variants={item}>
        <div className="relative overflow-hidden rounded-xl bg-slate-900 p-6 lg:p-8 text-white">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px'
          }} />
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest">GIS-SPPG · Command Center</p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1.5">
              {getGreeting()}, <span className="text-blue-400">{profile?.full_name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Pantau kapasitas produksi, distribusi kelompok, dan performa unit SPPG secara real-time.
            </p>
            <div className="mt-5">
              <Link to="/dashboard/mapping"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-all">
                <MapIcon size={15} /> Buka Peta
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Unit SPPG" value={data?.total_sppg || 0} sub="unit"
          iconBg="bg-blue-50" iconColor="text-blue-600"
          badge={`${data?.sppg_aktif || 0} aktif`}
        />
        <StatCard icon={Users} label="Total Kelompok" value={data?.total_kelompok || 0} sub="kelompok"
          iconBg="bg-violet-50" iconColor="text-violet-600"
          badge={`${(data?.total_sasaran || 0).toLocaleString()} sasaran`}
        />
        <StatCard icon={Target} label="Kelompok Terlayani" value={data?.kelompok_terlayani || 0} sub="terdistribusi"
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
        />
        <StatCard icon={CircleDot} label="Belum Terlayani" value={data?.kelompok_belum_terlayani || 0} sub="pending"
          iconBg="bg-amber-50" iconColor="text-amber-600"
        />
      </div>

      {/* ─── MIDDLE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* SPPG Status */}
        <motion.div variants={item} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity size={17} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Status SPPG</h3>
              <p className="text-xs text-slate-400">{data?.total_sppg || 0} total unit</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Aktif', value: data?.sppg_aktif || 0, color: '#059669', bg: 'bg-emerald-500' },
              { label: 'Nonaktif', value: data?.sppg_nonaktif || 0, color: '#dc2626', bg: 'bg-red-500' },
              { label: 'Maintenance', value: data?.sppg_maintenance || 0, color: '#d97706', bg: 'bg-amber-500' },
            ].map(s => {
              const pct = data ? Math.round((s.value / Math.max(data.total_sppg, 1)) * 100) : 0;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-medium text-slate-600">{s.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{s.value} <span className="font-normal text-slate-400">({pct}%)</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full ${s.bg}`}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Coverage Donut */}
        <motion.div variants={item} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Target size={17} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Cakupan Layanan</h3>
              <p className="text-xs text-slate-400">Kelompok tersalurkan</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1 justify-center py-2">
            <MiniDonut percent={sppgCovered} color="#059669" />
            <span className="text-3xl font-bold text-slate-900">{sppgCovered}%</span>
            <p className="text-xs text-slate-400">{data?.kelompok_terlayani || 0} dari {data?.total_kelompok || 0} kelompok</p>
          </div>
          <div className="flex items-center justify-center gap-8 mt-2 pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-base font-bold text-emerald-600">{data?.kelompok_terlayani || 0}</p>
              <p className="text-[10px] text-slate-400">Terlayani</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <p className="text-base font-bold text-amber-500">{data?.kelompok_belum_terlayani || 0}</p>
              <p className="text-[10px] text-slate-400">Belum</p>
            </div>
          </div>
        </motion.div>

        {/* Total Sasaran */}
        <motion.div variants={item} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
              <Orbit size={17} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Total Sasaran</h3>
              <p className="text-xs text-slate-400">Penerima manfaat</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <AnimatedBigNumber value={data?.total_sasaran || 0} />
            <p className="text-xs text-slate-400 mt-1">porsi sasaran terdistribusi</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
            {[
              { label: 'Aktif', value: data?.sppg_aktif || 0, color: 'text-emerald-600' },
              { label: 'Maintenance', value: data?.sppg_maintenance || 0, color: 'text-amber-500' },
              { label: 'Nonaktif', value: data?.sppg_nonaktif || 0, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-slate-50">
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── TOP SPPG RAPORT ─── */}
      <motion.div variants={item} className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <Cpu size={17} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Top 5 — Raport Kinerja SPPG</h3>
              <p className="text-xs text-slate-400">Peringkat berdasarkan rata-rata seluruh kategori</p>
            </div>
          </div>
          <Link to="/dashboard/raport" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Lihat Semua <ChevronRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">#</th>
                <th className="table-header">Nama SPPG</th>
                <th className="table-header hidden md:table-cell">Kode</th>
                <th className="table-header hidden lg:table-cell">Desa</th>
                <th className="table-header text-right">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {(data?.top_sppg?.length > 0 ? data.top_sppg : []).map((s, i) => (
                <motion.tr key={s.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="table-row last:border-0"
                >
                  <td className="px-4 py-3.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-100 text-slate-500' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-400'
                    }`}>{i + 1}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px] lg:max-w-none">{s.nama}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs font-mono text-slate-400">{s.kode_sppg}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-slate-400">{s.alamat_desa}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <motion.div className="h-full rounded-full"
                          style={{ background: s.rata_rata_score >= 80 ? '#059669' : s.rata_rata_score >= 60 ? '#d97706' : '#dc2626' }}
                          initial={{ width: 0 }} animate={{ width: `${Math.min(s.rata_rata_score, 100)}%` }}
                          transition={{ duration: 1.2, delay: i * 0.08 }} />
                      </div>
                      <ScoreRing score={s.rata_rata_score} size={34} />
                    </div>
                  </td>
                </motion.tr>
              ))}
              {(!data?.top_sppg || data.top_sppg.length === 0) && (
                <tr><td colSpan={5} className="py-10 text-center text-xs text-slate-400">Belum ada data raport</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  );
};

const AnimatedBigNumber = ({ value }) => {
  const animVal = useAnimatedNumber(value);
  return (
    <span className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
      {animVal.toLocaleString()}
    </span>
  );
};

export default StatsOverview;
