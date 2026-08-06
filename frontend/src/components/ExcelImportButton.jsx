import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileUp, Download, CheckCircle2, Loader2, AlertCircle, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const ExcelImportButton = ({ endpoint, onSuccess, title = "Import Data Excel", type = "sppg" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = () => {
    const templates = {
      sppg: [
        {
          nama: 'SPPG Contoh A',
          kode_sppg: 'SPPG-001',
          alamat_desa: 'Desa Merdeka',
          status_operasional: 'Aktif',
          tanggal_operasional: new Date().toISOString().split('T')[0],
          nama_kepala: 'Budi Santoso',
          pengawas_keuangan: 'Ani Wijaya',
          pengawas_gizi: 'Siti Aminah',
          pic_yayasan: 'Hendra',
          nama_yayasan: 'Yayasan Gizi Sejahtera',
          kapasitas_produksi: 3000,
          latitude: -8.6,
          longitude: 116.4
        }
      ],
      kelompok: [
        {
          nama: 'Sekolah Contoh',
          kode_kelompok: 'SCH-001',
          alamat_lengkap: 'Jl. Sudirman No. 10',
          latitude: -8.65,
          longitude: 116.45,
          jenis_kelompok: 'Sekolah',
          jenis_kepemilikan: 'Negeri',
          pj_nama: 'Pak Guru',
          no_whatsapp: '08123456789',
          email: 'sekolah@example.com',
          porsi_kecil: 50,
          porsi_besar: 30,
          jumlah_guru: 5,
          jumlah_tendik: 2,
          jumlah_busui: 0,
          jumlah_bumil: 0,
          jumlah_balita_non_paud: 0,
          jumlah_kader: 0
        }
      ]
    };

    const data = templates[type] || [];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `Template_Import_${type.toUpperCase()}.xlsx`);
    toast.success('Template berhasil diunduh');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data);
        toast.success(`Import Berhasil: ${data.success} baris ditambahkan`);
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.detail || 'Gagal mengimpor data');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan koneksi saat mengimpor');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const closeAll = () => {
    setIsModalOpen(false);
    setResults(null);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/10 flex items-center gap-2 transition-all cursor-pointer"
      >
        <FileSpreadsheet size={16} />
        <span className="hidden md:inline">Import Data</span>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {isModalOpen && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
            onClick={closeAll}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-blue-600 rounded-[2.5rem] overflow-hidden max-w-xl w-full shadow-2xl border border-blue-600 my-auto flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-8 bg-blue-600 text-white flex items-center justify-between -mt-px">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{title}</h3>
                    <p className="text-blue-100 text-xs font-bold opacity-80 uppercase tracking-widest">Bulk Import Tool</p>
                  </div>
                </div>
                <button onClick={closeAll} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 bg-white">
                {results ? (
                  /* Results View */
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                        <CheckCircle2 className="text-emerald-600 mx-auto mb-3" size={32} />
                        <p className="text-3xl font-black text-emerald-600 leading-none">{results.success}</p>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-2">Data Berhasil</p>
                      </div>
                      <div className="p-6 bg-red-50 rounded-3xl border border-red-100 text-center">
                        <AlertCircle className="text-red-600 mx-auto mb-3" size={32} />
                        <p className="text-3xl font-black text-red-600 leading-none">{results.failed}</p>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-2">Data Gagal</p>
                      </div>
                    </div>

                    {results.errors?.length > 0 && (
                      <div className="mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Detail Kesalahan</p>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {results.errors.map((err, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-red-500 border border-red-50/50">
                              {err}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={closeAll}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Selesai & Tutup
                    </button>
                  </div>
                ) : (
                  /* Selection View */
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mb-2">
                      <p className="text-xs font-bold text-slate-500 leading-relaxed">
                        Gunakan fitur ini untuk mengunggah data dalam jumlah banyak secara sekaligus. Pastikan format file sesuai dengan template yang disediakan.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={handleDownloadTemplate}
                        className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                      >
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Download size={24} />
                        </div>
                        <p className="font-black text-slate-800 text-sm">Download Template</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Excel (.xlsx)</p>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-8 bg-blue-600 text-white rounded-[2rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 group"
                      >
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          {loading ? <Loader2 className="animate-spin" size={24} /> : <FileUp size={24} />}
                        </div>
                        <p className="font-black text-sm">{loading ? 'Memproses...' : 'Upload File Data'}</p>
                        <p className="text-[10px] text-blue-200 font-bold uppercase mt-1">CSV / Excel / XLS</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ExcelImportButton;
