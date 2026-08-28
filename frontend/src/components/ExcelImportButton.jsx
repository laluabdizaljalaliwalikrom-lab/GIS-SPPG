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

      {isModalOpen && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
            onClick={closeAll}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-200 my-auto flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500 font-medium">Unggah data batch via spreadsheet</p>
                  </div>
                </div>
                <button onClick={closeAll} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 bg-white">
                {results ? (
                  /* Results View */
                  <div className="animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                        <CheckCircle2 className="text-emerald-600 mx-auto mb-2" size={24} />
                        <p className="text-2xl font-bold text-emerald-700 leading-none">{results.success}</p>
                        <p className="text-xs text-emerald-600 font-medium mt-1">Data Berhasil</p>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
                        <AlertCircle className="text-rose-600 mx-auto mb-2" size={24} />
                        <p className="text-2xl font-bold text-rose-700 leading-none">{results.failed}</p>
                        <p className="text-xs text-rose-600 font-medium mt-1">Data Gagal</p>
                      </div>
                    </div>

                    {results.errors?.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs font-semibold text-slate-500 mb-2">Detail Kesalahan</p>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                          {results.errors.map((err, i) => (
                            <div key={i} className="p-2.5 bg-rose-50/50 rounded-lg text-xs font-medium text-rose-600 border border-rose-100">
                              {err}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={closeAll}
                      className="btn-primary w-full"
                    >
                      Selesai & Tutup
                    </button>
                  </div>
                ) : (
                  /* Selection View */
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Fitur ini mengimpor data sekaligus. Pastikan format kolom sesuai dengan template Excel yang disediakan.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleDownloadTemplate}
                        className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all text-center group"
                      >
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <Download size={18} />
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">Download Template</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Format .xlsx</p>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 text-center group"
                      >
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          {loading ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                        </div>
                        <p className="font-semibold text-sm">{loading ? 'Memproses...' : 'Upload File Data'}</p>
                        <p className="text-xs text-blue-100 font-medium mt-0.5">CSV / Excel (.xlsx)</p>
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
