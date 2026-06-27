import { useState } from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Save, 
  MapPin, 
  Phone, 
  User, 
  Layers,
  Activity,
  AlertCircle,
  Check,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EntityDetailForm from './EntityDetailForm';
import SPPGChecklist from './SPPGChecklist';

import { useSPPG } from '../hooks/useSPPG';
import { useKelompok } from '../hooks/useKelompok';
import { toast } from 'react-hot-toast';

const EntityDetailDrawer = ({ isOpen, onClose, entity, type, profile }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const { updateSPPG, deleteSPPG, isUpdating: isUpdatingSPPG } = useSPPG();
  const { updateKelompok, deleteKelompok, verifyKelompok, assignKelompok, isUpdating: isUpdatingKelompok, isAssigning } = useKelompok();
  const { sppgs } = useSPPG();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [sppgSearch, setSppgSearch] = useState('');

  const isUpdating = type === 'sppg' ? isUpdatingSPPG : isUpdatingKelompok;

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!entity) return null;

  // RBAC Logic
  const canEdit = profile?.role === 'admin' || 
                 profile?.role === 'kecamatan_coordinator' ||
                 (profile?.role === 'sppg_head' && type === 'sppg' && profile?.sppg_id === entity.id);
  const canDelete = profile?.role === 'admin';
  const canVerify = (profile?.role === 'admin' || profile?.role === 'kecamatan_coordinator') && 
                   type === 'kelompok' && 
                   entity.status === 'pending_verification';

  const handleVerify = async (status) => {
    try {
      await verifyKelompok({ id: entity.id, status });
      handleClose(); // Close drawer after verification
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (data) => {
    try {
      if (type === 'sppg') {
        await updateSPPG({ id: entity.id, data });
      } else {
        await updateKelompok({ id: entity.id, data });
      }
      toast.success('Data berhasil diperbarui');
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      // Toast error is handled by hook usually, but adding explicit here just in case
      toast.error('Gagal memperbarui data');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Yakin ingin menghapus ${entity.nama}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        if (type === 'sppg') {
          await deleteSPPG(entity.id);
        } else {
          await deleteKelompok(entity.id);
        }
        toast.success('Data berhasil dihapus');
        onClose();
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus data');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998]"
          />
          
          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-blue-600 shadow-2xl z-[9999] flex flex-col shadow-[0_0_0_1px_#2563eb]"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                   {type === 'sppg' ? <Layers size={24} /> : <Activity size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{isEditing ? 'Edit Informasi' : 'Detail Informasi'}</h2>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em]">{type === 'sppg' ? 'Unit Gizi SPPG' : 'Kelompok Penerima'}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              {isEditing ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <EntityDetailForm 
                    type={type}
                    formId="detail-edit-form"
                    initialData={entity} 
                    onSubmit={handleSave} 
                  />
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Title & Badge Section */}
                  <div>
                    <div className="flex gap-2 mb-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">
                        {entity.kode_sppg || entity.kode_kelompok}
                      </span>
                      {entity.status_operasional && (
                        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border ${
                          entity.status_operasional === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {entity.status_operasional}
                        </span>
                      )}
                      {entity.jenis_kelompok && (
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-100">
                          {entity.jenis_kelompok}
                        </span>
                      )}
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-black text-slate-800 leading-tight">{entity.nama}</h3>
                  </div>

                  {/* Information Cards */}
                  <div className="grid grid-cols-1 gap-5">
                    <InfoCard 
                      icon={MapPin} 
                      label="Lokasi & Alamat" 
                      value={entity.alamat_desa || entity.alamat_lengkap} 
                      subValue={`${entity.lat.toFixed(6)}, ${entity.lng.toFixed(6)}`}
                    />
                    <InfoCard 
                      icon={User} 
                      label="Penanggung Jawab" 
                      value={entity.nama_kepala || entity.pj_nama} 
                      subValue={type === 'sppg' ? 'Kepala Unit' : 'P.J Kelompok'}
                    />
                    {(entity.no_whatsapp || entity.email) && (
                      <InfoCard 
                        icon={Phone} 
                        label="Kontak" 
                        value={entity.no_whatsapp || entity.email} 
                        subValue={entity.email ? 'Email Address' : 'WhatsApp Number'}
                      />
                    )}
                    {type === 'kelompok' && entity.assigned_sppg_id && (
                      <InfoCard 
                        icon={Layers} 
                        label="SPPG Terpilih" 
                        value={sppgs?.find(s => s.id === entity.assigned_sppg_id)?.nama || 'Memuat...'} 
                        subValue={sppgs?.find(s => s.id === entity.assigned_sppg_id)?.kode_sppg || 'Unit Penyalur'}
                      />
                    )}
                  </div>

                  {/* SPPG Specific: Production Capacity & Raport */}
                  {type === 'sppg' && (
                    <div className="space-y-6">
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                        <div className="relative z-10">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <AlertCircle size={14} className="text-blue-500" /> Kapasitas Produksi
                          </h4>
                          <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-slate-800 tracking-tighter">{entity.kapasitas_produksi.toLocaleString()}</span>
                            <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Porsi / Hari</span>
                          </div>
                        </div>
                        <Layers className="absolute -bottom-6 -right-6 text-slate-200/50 w-32 h-32 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                      </div>

                    </div>
                  )}

                  {/* Kelompok Specific: Target Gizi */}
                  {type === 'kelompok' && entity.detail && (
                    <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                      <div className="relative z-10">
                        <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Activity size={14} /> Target Distribusi Gizi
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(entity.detail).map(([key, val]) => (
                            val > 0 && (
                              <div key={key} className="bg-white/10 p-4 rounded-[1.5rem] border border-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                                <p className="text-[9px] font-black text-blue-200 uppercase tracking-[0.1em] mb-1">
                                  {key.replace('jumlah_', '').replace('_', ' ')}
                                </p>
                                <p className="text-2xl font-black">{val.toLocaleString()}</p>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-6 lg:p-8 bg-white border-t border-slate-100 flex gap-4">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Batalkan
                  </button>
                  <button 
                    form="detail-edit-form"
                    disabled={isUpdating}
                    className="flex-[2] px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] disabled:opacity-50 active:scale-95"
                  >
                    {isUpdating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                    Simpan Perubahan
                  </button>
                </>
              ) : (
                <>
                  {canDelete && (
                    <button 
                      onClick={handleDelete}
                      className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                      title="Hapus Data"
                    >
                      <Trash2 size={22} className="group-hover:scale-110 transition-transform" />
                    </button>
                  )}
                  <div className="flex gap-2">
                    {canVerify && (
                      <>
                        <button 
                          onClick={() => handleVerify('verified')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                        >
                           <Check size={16} /> Verifikasi
                        </button>
                        <button 
                          onClick={() => handleVerify('rejected')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-red-100 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 transition-all active:scale-95"
                        >
                           <XCircle size={16} /> Tolak
                        </button>
                      </>
                    )}
                  </div>
                  {canEdit && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex-1 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] active:scale-95"
                    >
                      <Edit3 size={18} />
                      Edit Informasi
                    </button>
                  )}
                  {type === 'kelompok' && canEdit && (
                    <div className="flex-1">
                      {!entity.assigned_sppg_id ? (
                        <button 
                          onClick={() => setIsAssignModalOpen(true)}
                          className="w-full px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] active:scale-95"
                        >
                          <Layers size={18} />
                          Assign to SPPG
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Unassign ${entity.nama} dari SPPG saat ini?`)) {
                              await assignKelompok({ 
                                id: entity.id, 
                                sppgId: null, 
                                groupName: entity.nama, 
                                sppgName: 'None' 
                              });
                            }
                          }}
                          className="w-full px-8 py-4 bg-red-50 text-red-600 border-2 border-red-100 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] active:scale-95 group"
                        >
                          <XCircle size={18} className="group-hover:scale-110 transition-transform" />
                          Unassign SPPG
                        </button>
                      )}
                    </div>
                  )}
                  {!canEdit && (
                    <button 
                      onClick={onClose}
                      className="flex-1 px-8 py-4 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-900 transition-all uppercase tracking-widest text-[10px]"
                    >
                      Tutup Detail
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
          
          {/* Assignment Modal */}
          <AnimatePresence>
            {isAssignModalOpen && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAssignModalOpen(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                  <div className="p-8 bg-emerald-600 text-white">
                    <h3 className="text-xl font-black mb-1">Assign to SPPG</h3>
                    <p className="text-emerald-100 text-xs">Pilih unit SPPG untuk alokasi kelompok ini.</p>
                  </div>
                  <div className="p-6">
                    <input 
                      type="text"
                      placeholder="Cari SPPG..."
                      value={sppgSearch}
                      onChange={(e) => setSppgSearch(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all mb-4 text-sm font-medium"
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {Array.isArray(sppgs) && sppgs
                        .filter(s => s.nama && s.nama.toLowerCase().includes(sppgSearch.toLowerCase()))
                        .map(s => (
                          <button
                            key={s.id}
                            onClick={async () => {
                              try {
                                await assignKelompok({ 
                                  id: entity.id, 
                                  sppgId: s.id, 
                                  groupName: entity.nama, 
                                  sppgName: s.nama 
                                });
                                setIsAssignModalOpen(false);
                                onClose();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            disabled={isAssigning}
                            className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-2xl transition-all group"
                          >
                            <div className="text-left">
                              <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{s.nama}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Kapasitas Sisa: <span className="text-emerald-600">{(s.remaining_capacity || 0).toLocaleString()}</span></p>
                            </div>
                            <Save size={18} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                          </button>
                        ))
                      }
                      {(!Array.isArray(sppgs) || sppgs.length === 0) && <p className="text-center py-8 text-slate-400 text-sm italic">Tidak ada SPPG tersedia.</p>}
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 flex gap-3">
                    <button 
                      onClick={() => setIsAssignModalOpen(false)}
                      className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
                    >
                      Batal
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

const ScoreBar = ({ label, score, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-800">{score}%</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color} rounded-full shadow-[0_0_10px_rgba(37,99,235,0.2)]`}
      />
    </div>
  </div>
);

const InfoCard = ({ icon: Icon, label, value, subValue }) => (
  <div className="flex gap-5 p-5 rounded-[2rem] border border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group">
    <div className="w-14 h-14 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
      <Icon size={24} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-slate-800 font-bold text-lg leading-tight truncate">{value}</p>
      {subValue && <p className="text-xs text-slate-500 font-medium mt-1 tracking-tight">{subValue}</p>}
    </div>
  </div>
);

export default EntityDetailDrawer;
