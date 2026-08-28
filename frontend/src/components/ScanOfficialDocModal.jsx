import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, CheckCircle2, 
  Sparkles, Loader2, X, FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { compressImage, formatFileSize } from '../utils/imageCompressor';

const ScanOfficialDocModal = ({ isOpen, onClose, onApplyExtractedData }) => {
  const [file, setFile] = useState(null);
  const [compressedResult, setCompressedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    await processFile(dropped);
  };

  const processFile = async (rawFile) => {
    setFile(rawFile);
    setScanResult(null);
    try {
      // Compress image client side
      const comp = await compressImage(rawFile, {
        maxWidth: 1800,
        maxHeight: 1800,
        quality: 0.8,
        mimeType: 'image/webp'
      });
      setCompressedResult(comp);
    } catch (err) {
      console.warn('Compression error:', err);
      setCompressedResult({
        file: rawFile,
        previewUrl: null,
        originalSize: rawFile.size,
        compressedSize: rawFile.size,
        savedPercent: 0,
        name: rawFile.name
      });
    }
  };

  const handlePerformScan = async () => {
    if (!compressedResult?.file) {
      toast.error('Harap pilih file dokumen terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', compressedResult.file);

    try {
      const { data } = await api.post('/commodities/survey/scan-official-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScanResult(data);
      toast.success('Dokumen berhasil dipindai & diekstrak!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Gagal memindai dokumen survey.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!scanResult) return;
    onApplyExtractedData({
      official_doc_url: scanResult.doc_url,
      shop_name: scanResult.extracted_data?.shop_name || '',
      region_id: scanResult.extracted_data?.region_id || 'Sikur',
      survey_date: scanResult.extracted_data?.survey_date || '',
      head_of_market_name: scanResult.extracted_data?.head_of_market_name || '',
      surveyor_name: scanResult.extracted_data?.surveyor_name || '',
      items: scanResult.extracted_data?.items || []
    });
    toast.success('Data hasil scan diterapkan ke formulir survey!');
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setCompressedResult(null);
    setScanResult(null);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden z-10 border border-slate-200 flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Scan Dokumen Pengesahan Kepala Pasar</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    AI OCR Vision
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Unggah berkas bertanda tangan/cap resmi untuk diekstrak otomatis.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* Upload Box */}
            {!scanResult && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : file 
                    ? 'border-emerald-400 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-blue-300 bg-slate-50/50'
                }`}
                onClick={() => document.getElementById('scan-doc-input')?.click()}
              >
                <input
                  id="scan-doc-input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud size={24} />
                </div>

                <h4 className="text-sm font-semibold text-slate-800">
                  {file ? file.name : 'Pilih Berkas atau Tarik ke Sini'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                  Format gambar (JPG, PNG, WebP) atau PDF hasil scan lembar pengesahan harga kepala pasar.
                </p>

                {compressedResult && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm text-xs">
                    <span className="text-slate-400">Asli: <strong className="text-slate-700">{formatFileSize(compressedResult.originalSize)}</strong></span>
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-700 font-semibold">
                      Terkompresi: {formatFileSize(compressedResult.compressedSize)} ({compressedResult.savedPercent}% hemat)
                    </span>
                  </div>
                )}
              </div>
            )}


            {/* Scanned Result Preview */}
            {scanResult && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Pemindaian Berhasil</h4>
                      <p className="text-xs text-emerald-700">
                        {scanResult.extracted_data?.items?.length || 0} komoditas & harga berhasil dikenali.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                    Kompresi: {formatFileSize(scanResult.compressed_size)} ({scanResult.saved_percentage}% hemat)
                  </span>
                </div>

                {/* Metadata Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pasar / Toko</span>
                    <p className="font-bold text-slate-800">{scanResult.extracted_data?.shop_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Wilayah</span>
                    <p className="font-bold text-slate-800">{scanResult.extracted_data?.region_id || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Kepala Pasar</span>
                    <p className="font-bold text-blue-700">{scanResult.extracted_data?.head_of_market_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Petugas Survey</span>
                    <p className="font-bold text-slate-800">{scanResult.extracted_data?.surveyor_name || '-'}</p>
                  </div>
                </div>

                {/* Item List */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-100/70 px-4 py-2.5 text-[11px] font-black text-slate-600 uppercase tracking-wider grid grid-cols-12">
                    <span className="col-span-6">Komoditas</span>
                    <span className="col-span-3 text-right">Harga</span>
                    <span className="col-span-3 text-right">Satuan</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {scanResult.extracted_data?.items?.map((item, idx) => (
                      <div key={idx} className="px-4 py-2.5 text-xs grid grid-cols-12 items-center hover:bg-slate-50">
                        <span className="col-span-6 font-bold text-slate-800 truncate">{item.item_name}</span>
                        <span className="col-span-3 text-right font-black text-emerald-700">
                          Rp {Number(item.reference_price || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="col-span-3 text-right text-slate-500 font-medium">{item.unit || 'kg'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all"
            >
              Batal
            </button>

            {!scanResult ? (
              <button
                type="button"
                onClick={handlePerformScan}
                disabled={!file || isProcessing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Memindai OCR...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Mulai Pindai Dokumen
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <CheckCircle2 size={15} />
                Terapkan ke Form Survey
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ScanOfficialDocModal;
