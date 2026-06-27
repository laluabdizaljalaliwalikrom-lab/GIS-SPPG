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

const GradientStatCard = ({ icon: Icon, label, value, sub, color, gradient, children }) => {
  const animVal = useAnimatedNumber(value);
  return (
    <motion.div variants={item} className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem] blur-xl -z-10"
        style={{ background: gradient }} />
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl shadow-black/5 p-6 lg:p-8 h-full transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ background: gradient }}>
            <Icon size={22} />
          </div>
          {children}
        </div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">{animVal.toLocaleString()}</span>
          {sub && <span className="text-xs font-semibold text-slate-400">{sub}</span>}
        </div>
      </div>
    </motion.div>
  );
};

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
      <div className="space-y-6 animate-pulse">
        <div className="h-56 bg-slate-100 rounded-[2rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-[2rem]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-72 bg-slate-100 rounded-[2rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* ─── HERO ─── */}
      <motion.div variants={item}>
        <div className="relative overflow-hidden rounded-[2rem] p-6 lg:p-10 text-white"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2b4a 50%, #0a1e35 100%)' }}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/10 rounded-full -ml-20 -mb-20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
                <Sparkles size={18} className="text-blue-200" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-blue-200/70">GIS-SPPG — Command Center</span>
            </div>

            <h1 className="text-2xl lg:text-4xl font-black tracking-tight mb-2">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">
                {profile?.full_name?.split(' ')[0] || 'User'}
              </span>
            </h1>
            <p className="text-blue-200/80 text-sm max-w-2xl leading-relaxed">
              Pusat kendali pemetaan dan alokasi SPPG. Pantau kapasitas produksi, distribusi kelompok, dan performa unit secara real-time.
            </p>

            <div className="mt-6 flex gap-3">
              <Link to="/dashboard/mapping"
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                <MapIcon size={15} /> Buka Peta
              </Link>
            </div>
          </div>

          <div className="hidden lg:block absolute right-10 bottom-6 opacity-[0.06]">
            <Radar size={200} />
          </div>
        </div>
      </motion.div>

      {/* ─── PRIMARY STATS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <GradientStatCard
          icon={Building2} label="Total Unit SPPG" value={data?.total_sppg || 0} sub="unit"
          gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
        >
          <div className="flex gap-1.5">
            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">{(data?.sppg_aktif || 0)} Aktif</span>
          </div>
        </GradientStatCard>

        <GradientStatCard
          icon={Users} label="Total Kelompok" value={data?.total_kelompok || 0} sub="kelompok"
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
        >
          <div className="text-[9px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-600">{data?.total_sasaran?.toLocaleString() || 0} Sasaran</div>
        </GradientStatCard>

        <GradientStatCard
          icon={Target} label="Kelompok Terlayani" value={data?.kelompok_terlayani || 0} sub="terdistribusi"
          gradient="linear-gradient(135deg, #10b981, #059669)"
        />

        <GradientStatCard
          icon={CircleDot} label="Kelompok Belum Terlayani" value={data?.kelompok_belum_terlayani || 0} sub="pending"
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
        />
      </div>

      {/* ─── MIDDLE: DISTRIBUTION + COVERAGE + SPPG STATUS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* SPPG Status Breakdown */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl shadow-black/5 p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Status SPPG</h3>
              <p className="text-[9px] font-semibold text-slate-400">{data?.total_sppg || 0} total unit</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Aktif', value: data?.sppg_aktif || 0, color: '#10b981', bg: 'bg-emerald-50' },
              { label: 'Nonaktif', value: data?.sppg_nonaktif || 0, color: '#ef4444', bg: 'bg-red-50' },
              { label: 'Maintenance', value: data?.sppg_maintenance || 0, color: '#f59e0b', bg: 'bg-amber-50' },
            ].map(s => {
              const pct = data ? Math.round((s.value / Math.max(data.total_sppg, 1)) * 100) : 0;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.bg}`} style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-bold text-slate-600">{s.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{s.value} <span className="font-semibold text-slate-400">({pct}%)</span></span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: s.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Coverage Donut */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl shadow-black/5 p-6 lg:p-8 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-4 self-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Target size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Cakupan Layanan</h3>
              <p className="text-[9px] font-semibold text-slate-400">kelompok tersalurkan</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 my-4">
            <MiniDonut percent={sppgCovered} color="#10b981" />
            <span className="text-3xl font-black text-slate-800">{sppgCovered}%</span>
            <p className="text-[10px] font-semibold text-slate-400">
              {data?.kelompok_terlayani || 0} dari {data?.total_kelompok || 0} kelompok
            </p>
          </div>
          <div className="flex items-center gap-6 mt-2 text-center">
            <div>
              <p className="text-lg font-black text-emerald-600">{data?.kelompok_terlayani || 0}</p>
              <p className="text-[9px] font-semibold text-slate-400">Terlayani</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <p className="text-lg font-black text-amber-500">{data?.kelompok_belum_terlayani || 0}</p>
              <p className="text-[9px] font-semibold text-slate-400">Belum</p>
            </div>
          </div>
        </motion.div>

        {/* Total Sasaran */}
        <motion.div variants={item} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl shadow-black/5 p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Orbit size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Total Sasaran</h3>
              <p className="text-[9px] font-semibold text-slate-400">penerima manfaat</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <AnimatedBigNumber value={data?.total_sasaran || 0} />
            <p className="text-[10px] font-semibold text-slate-400 mt-1">porsi sasaran terdistribusi</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'SPPG Aktif', value: data?.sppg_aktif || 0, color: 'text-emerald-600' },
              { label: 'Maintenance', value: data?.sppg_maintenance || 0, color: 'text-amber-500' },
              { label: 'Nonaktif', value: data?.sppg_nonaktif || 0, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-slate-50">
                <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── BOTTOM: TOP SPPG RAPORT ─── */}
      <motion.div variants={item} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl shadow-black/5 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Cpu size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Top 5 — Raport Kinerja SPPG</h3>
              <p className="text-[9px] font-semibold text-slate-400">peringkat berdasarkan rata-rata seluruh kategori</p>
            </div>
          </div>
          <Link to="/dashboard/raport"
            className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
            Lihat Semua <ChevronRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] pb-3 pr-4">#</th>
                <th className="text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] pb-3 pr-4">Nama SPPG</th>
                <th className="text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] pb-3 pr-4 hidden md:table-cell">Kode</th>
                <th className="text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] pb-3 pr-4 hidden lg:table-cell">Desa</th>
                <th className="text-right text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] pb-3">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {(data?.top_sppg?.length > 0 ? data.top_sppg : []).map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                  className="border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors rounded-xl"
                >
                  <td className="py-3.5 pr-4">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-100 text-slate-500' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[160px] lg:max-w-none">{s.nama}</p>
                  </td>
                  <td className="py-3.5 pr-4 hidden md:table-cell">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{s.kode_sppg}</span>
                  </td>
                  <td className="py-3.5 pr-4 hidden lg:table-cell">
                    <span className="text-[10px] font-semibold text-slate-400">{s.alamat_desa}</span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-full max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: s.rata_rata_score >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' :
                                       s.rata_rata_score >= 60 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                       'linear-gradient(90deg, #ef4444, #dc2626)',
                            width: `${Math.min(s.rata_rata_score, 100)}%`
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(s.rata_rata_score, 100)}%` }}
                          transition={{ duration: 1.2, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                      </div>
                      <ScoreRing score={s.rata_rata_score} size={36} />
                    </div>
                  </td>
                </motion.tr>
              ))}
              {(!data?.top_sppg || data.top_sppg.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <p className="text-xs font-semibold text-slate-300">Belum ada data raport</p>
                  </td>
                </tr>
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
    <span className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-500 tracking-tighter">
      {animVal.toLocaleString()}
    </span>
  );
};

export default StatsOverview;
