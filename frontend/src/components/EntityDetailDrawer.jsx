import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    if (isOpen || isAssignModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isAssignModalOpen]);

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!isOpen || !entity) return null;

  const isUpdating = type === 'sppg' ? isUpdatingSPPG : isUpdatingKelompok;

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
      handleClose();
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

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 w-screen h-screen z-[9999] bg-slate-950/80 backdrop-blur-sm overflow-hidden"
        onClick={handleClose}
      >
        {/* Drawer */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[10000] flex flex-col border-l border-slate-200"
        >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                   {type === 'sppg' ? <Layers size={18} /> : <Activity size={18} />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{isEditing ? 'Edit Data' : 'Detail Informasi'}</h2>
                  <p className="text-xs text-slate-500 font-medium">{type === 'sppg' ? 'Unit Gizi SPPG' : 'Kelompok Penerima'}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
              {isEditing ? (
                <div className="animate-in fade-in duration-200">
                  <EntityDetailForm 
                    type={type}
                    formId="detail-edit-form"
                    initialData={entity} 
                    onSubmit={handleSave} 
                  />
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Title & Badge Section */}
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                        {entity.kode_sppg || entity.kode_kelompok}
                      </span>
                      {entity.status_operasional && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                          entity.status_operasional === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {entity.status_operasional}
                        </span>
                      )}
                      {entity.jenis_kelompok && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs font-semibold rounded border border-slate-200">
                          {entity.jenis_kelompok}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">{entity.nama}</h3>
                  </div>

                  {/* Information Cards */}
                  <div className="grid grid-cols-1 gap-3">
                    <InfoCard 
                      icon={MapPin} 
                      label="Lokasi & Alamat" 
                      value={entity.alamat_desa || entity.alamat_lengkap} 
                      subValue={`${entity.lat?.toFixed(6)}, ${entity.lng?.toFixed(6)}`}
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
                        subValue={entity.email ? 'Email' : 'WhatsApp'}
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

                  {/* SPPG Specific: Production Capacity */}
                  {type === 'sppg' && (
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kapasitas Produksi</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900">{entity.kapasitas_produksi?.toLocaleString()}</span>
                        <span className="text-slate-500 text-xs font-medium">Porsi / Hari</span>
                      </div>
                    </div>
                  )}

                  {/* Kelompok Specific: Target Gizi */}
                  {type === 'kelompok' && entity.detail && (
                    <div className="p-5 bg-slate-900 rounded-xl text-white space-y-3">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Target Distribusi Gizi</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {Object.entries(entity.detail).map(([key, val]) => (
                          val > 0 && (
                            <div key={key} className="bg-white/10 p-3 rounded-lg border border-white/10">
                              <p className="text-[10px] text-slate-300 capitalize">
                                {key.replace('jumlah_', '').replace(/_/g, ' ')}
                              </p>
                              <p className="text-lg font-bold text-white">{val.toLocaleString()}</p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    Batal
                  </button>
                  <button 
                    form="detail-edit-form"
                    disabled={isUpdating}
                    className="btn-primary"
                  >
                    {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Simpan Perubahan
                  </button>
                </>
              ) : (
                <>
                  {canDelete && (
                    <button 
                      onClick={handleDelete}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Data"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {canVerify && (
                    <>
                      <button 
                        onClick={() => handleVerify('verified')}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5"
                      >
                         <Check size={14} /> Verifikasi
                      </button>
                      <button 
                        onClick={() => handleVerify('rejected')}
                        className="px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5"
                      >
                         <XCircle size={14} /> Tolak
                      </button>
                    </>
                  )}
                  {canEdit && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="btn-secondary text-xs"
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                  )}
                  {type === 'kelompok' && canEdit && (
                    <div>
                      {!entity.assigned_sppg_id ? (
                        <button 
                          onClick={() => setIsAssignModalOpen(true)}
                          className="btn-primary text-xs"
                        >
                          <Layers size={15} />
                          Assign SPPG
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
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5"
                        >
                          <XCircle size={14} />
                          Unassign
                        </button>
                      )}
                    </div>
                  )}
                  {!canEdit && (
                    <button 
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      Tutup
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
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative w-full max-w-md flex flex-col"
                >
                  <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="text-base font-bold text-slate-900">Assign ke SPPG</h3>
                      <p className="text-xs text-slate-500 font-medium">Pilih unit SPPG untuk alokasi kelompok ini.</p>
                    </div>
                    <div className="p-6">
                    <input 
                      type="text" 
                      placeholder="Cari SPPG..."
                      value={sppgSearch}
                      onChange={(e) => setSppgSearch(e.target.value)}
                      className="input mb-3"
                    />
                    <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
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
                            className="w-full p-3 flex items-center justify-between bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-lg transition-all text-left"
                          >
                            <div>
                              <p className="font-semibold text-sm text-slate-800">{s.nama}</p>
                              <p className="text-xs text-slate-500">Sisa: <span className="text-blue-600 font-medium">{(s.remaining_capacity || 0).toLocaleString()}</span></p>
                            </div>
                            <Save size={16} className="text-slate-400" />
                          </button>
                        ))
                      }
                      {(!Array.isArray(sppgs) || sppgs.length === 0) && <p className="text-center py-6 text-slate-400 text-xs italic">Tidak ada SPPG tersedia.</p>}
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={() => setIsAssignModalOpen(false)}
                      className="btn-secondary"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </motion.div>
              </div>
            )}
          </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body
  );
};

const ScoreBar = ({ label, score, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-xs font-semibold">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800">{score}%</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  </div>
);

const InfoCard = ({ icon: Icon, label, value, subValue }) => (
  <div className="flex gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all">
    <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-slate-900 font-semibold text-sm leading-snug truncate">{value}</p>
      {subValue && <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{subValue}</p>}
    </div>
  </div>
);

export default EntityDetailDrawer;

