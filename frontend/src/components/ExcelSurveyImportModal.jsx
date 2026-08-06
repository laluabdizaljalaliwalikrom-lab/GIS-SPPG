import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, Download, UploadCloud, X, AlertCircle, 
  CheckCircle2, Sparkles, Loader2, Info, Building2, MapPin, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const ExcelSurveyImportModal = ({ isOpen, onClose, existingCommodities = [], onSuccess, currentUser }) => {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [headerForm, setHeaderForm] = useState({
    region_id: 'Sikur',
    shop_name: '',
    survey_date: new Date().toISOString().split('T')[0],
    surveyor_name: currentUser?.full_name || ''
  });

  const regionList = [
    'Aikmel', 'Jerowaru', 'Keruak', 'Labuhan Haji', 'Lenek', 'Masbagik',
    'Montong Gading', 'Pringgabaya', 'Pringgasela', 'Sakra', 'Sakra Barat',
    'Sakra Timur', 'Sambelia', 'Selong', 'Sembalun', 'Sikur', 'Sukamulia',
    'Suralaga', 'Suela', 'Terara', 'Wanasaba'
  ];

  // Helper to normalize strings for comparison
  const normalize = (str) => (str || '').toLowerCase().trim();

  // Handle Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Komoditas': 'Beras Premium',
        'Harga Acuan (Rp)': 14500,
        'Satuan': 'kg',
        'Nama Pasar / Toko': 'Pasar Sikur',
        'Wilayah / Desa': 'Sikur',
        'Penjual / Supplier': 'Toko Berkah',
        'Catatan': 'Kualitas Super Medium'
      },
      {
        'Nama Komoditas': 'Telur Ayam Ras',
        'Harga Acuan (Rp)': 28000,
        'Satuan': 'kg',
        'Nama Pasar / Toko': 'Pasar Sikur',
        'Wilayah / Desa': 'Sikur',
        'Penjual / Supplier': 'UD Sumber Rejeki',
        'Catatan': 'Segar'
      },
      {
        'Nama Komoditas': 'Minyak Goreng Bimoli',
        'Harga Acuan (Rp)': 19000,
        'Satuan': 'liter',
        'Nama Pasar / Toko': 'Pasar Sikur',
        'Wilayah / Desa': 'Sikur',
        'Penjual / Supplier': 'Toko Berkah',
        'Catatan': 'Pouch 1 Liter'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    // Set column widths for readability
    worksheet['!cols'] = [
      { wch: 25 }, { wch: 18 }, { wch: 10 }, { wch: 20 },
      { wch: 15 }, { wch: 20 }, { wch: 25 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Survey');
    XLSX.writeFile(workbook, 'Template_Survey_Harga_SPPG.xlsx');
    toast.success('Template Excel berhasil diunduh!');
  };

  // Process and validate Excel File
  const processExcelFile = (uploadedFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet);

        if (!rawJson || rawJson.length === 0) {
          toast.error('File Excel kosong atau format tidak dikenali.');
          return;
        }

        const existingNames = existingCommodities.map(c => normalize(c.nama));

        const rows = rawJson.map((row, index) => {
          const rawName = row['Nama Komoditas'] || row['nama_komoditas'] || row['Komoditas'] || row['Nama'] || '';
          const rawPrice = row['Harga Acuan (Rp)'] || row['Harga Acuan'] || row['harga'] || row['Harga'] || 0;
          const rawUnit = row['Satuan'] || row['satuan'] || 'kg';
          const shopName = row['Nama Pasar / Toko'] || row['shop_name'] || '';
          const regionId = row['Wilayah / Desa'] || row['region_id'] || '';
          const supplierName = row['Penjual / Supplier'] || row['supplier_name'] || '';
          const notes = row['Catatan'] || row['notes'] || '';

          const itemName = String(rawName).trim();
          const price = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
          const unit = String(rawUnit).trim() || 'kg';

          const isValid = itemName.length > 0 && price > 0;
          const isExistingMaster = existingNames.includes(normalize(itemName));

          return {
            id: index + 1,
            item_name: itemName,
            reference_price: price,
            unit: unit,
            shop_name: shopName,
            region_id: regionId,
            supplier_name: supplierName,
            notes: notes,
            isValid,
            isExistingMaster
          };
        });

        setParsedRows(rows);
        setFile(uploadedFile);

        const validCount = rows.filter(r => r.isValid).length;
        toast.success(`File berhasil dibaca: ${validCount} baris valid dari total ${rows.length} baris.`);
      } catch (err) {
        console.error(err);
        toast.error('Gagal membaca file Excel. Pastikan format file sesuai template.');
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processExcelFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
  };

  const handleSubmitImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('Tidak ada baris data valid untuk diimpor.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Memproses Batch Import Excel...', {
      style: { borderRadius: '1.5rem', background: '#1e293b', color: '#fff', padding: '1rem 1.5rem' }
    });

    try {
      const payload = {
        region_id: headerForm.region_id,
        shop_name: headerForm.shop_name,
        survey_date: headerForm.survey_date,
        surveyor_name: headerForm.surveyor_name,
        rows: validRows.map(r => ({
          item_name: r.item_name,
          reference_price: r.reference_price,
          unit: r.unit,
          shop_name: r.shop_name || headerForm.shop_name,
          region_id: r.region_id || headerForm.region_id,
          supplier_name: r.supplier_name,
          notes: r.notes
        }))
      };

      const res = await api.post('/commodities/survey/import-excel', payload);
      toast.success(res.data.message || `Berhasil mengimpor ${validRows.length} item survei!`, {
        id: toastId,
        icon: '🚀'
      });

      if (onSuccess) onSuccess();
      onClose();
      handleReset();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Gagal mengimpor survei dari Excel.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const newCommodityCount = parsedRows.filter(r => r.isValid && !r.isExistingMaster).length;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] my-auto"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30 shrink-0">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Import Survey Harga Excel
                  <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/50">
                    Auto-Matching
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">Unggah file .xlsx survei harga pasar bahan baku sekaligus.</p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose} 
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all relative z-10"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

            {/* Template Download Banner */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <Download size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Belum Memiliki Format Template?</h4>
                  <p className="text-xs text-slate-500 font-medium">Unduh file template Excel resmi dengan kolom terstandar.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <Download size={14} /> Download Template (.xlsx)
              </button>
            </div>

            {/* Header Form Settings (Applied to all rows if not explicitly set in Excel) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MapPin size={12} className="text-blue-600" /> Wilayah / Kecamatan *
                </label>
                <select
                  value={headerForm.region_id}
                  onChange={(e) => setHeaderForm({ ...headerForm, region_id: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {regionList.map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Building2 size={12} className="text-blue-600" /> Nama Pasar / Toko
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pasar Sikur"
                  value={headerForm.shop_name}
                  onChange={(e) => setHeaderForm({ ...headerForm, shop_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Calendar size={12} className="text-blue-600" /> Tanggal Survey *
                </label>
                <input
                  type="date"
                  value={headerForm.survey_date}
                  onChange={(e) => setHeaderForm({ ...headerForm, survey_date: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Dropzone Upload Area */}
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <input
                  type="file"
                  id="excel-survey-file-input"
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                />
                
                <label htmlFor="excel-survey-file-input" className="cursor-pointer space-y-3 w-full flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-100/80 text-emerald-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/10">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Tarik & Lepas File Excel di Sini</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">atau klik untuk memilih file dari komputer</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                    Format Didukung: .XLSX, .XLS, .CSV
                  </span>
                </label>
              </div>
            ) : (
              /* Preview & Validation Matrix Table */
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={20} className="text-emerald-400" />
                    <div>
                      <p className="text-xs font-black truncate max-w-xs">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Ukuran: {(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30">
                        ✓ {validCount} Valid
                      </span>
                      {newCommodityCount > 0 && (
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30">
                          + {newCommodityCount} Komoditas Baru
                        </span>
                      )}
                      {invalidCount > 0 && (
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30">
                          ✕ {invalidCount} Error
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Ganti File
                    </button>
                  </div>
                </div>

                {/* Table Data Preview */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">No</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Komoditas Excel</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Harga (Rp)</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Satuan</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Pasar / Toko</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Status Matching</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {parsedRows.map((row) => {
                        return (
                          <tr key={row.id} className={!row.isValid ? 'bg-rose-50/60' : 'hover:bg-slate-50'}>
                            <td className="px-4 py-3 font-mono text-slate-400">{row.id}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {row.item_name || <span className="text-rose-500 italic">Nama Kosong</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">
                              {row.reference_price > 0 
                                ? `Rp ${row.reference_price.toLocaleString('id-ID')}` 
                                : <span className="text-rose-500 italic">0 / Invalid</span>}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-slate-600">{row.unit}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium truncate max-w-[140px]">
                              {row.shop_name || headerForm.shop_name || '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {!row.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                  <AlertCircle size={12} /> Invalid Row
                                </span>
                              ) : row.isExistingMaster ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                  <CheckCircle2 size={12} /> Master Eksisting
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                                  <Sparkles size={12} /> Auto-Register Baru
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Footer Modal Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-4 shrink-0">
            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              {file ? `${validCount} baris siap diimpor ke database.` : 'Pilih file Excel untuk memulai pratinjau.'}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition-all"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSubmitImport}
                disabled={!file || validCount === 0 || isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Memproses Batch...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={14} /> Proses Import ({validCount} Baris)
                  </>
                )}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ExcelSurveyImportModal;
