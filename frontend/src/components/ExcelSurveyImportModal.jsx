import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, Download, UploadCloud, X, AlertCircle, 
  CheckCircle2, Sparkles, Loader2, Info, Building2, MapPin, Calendar,
  Camera, FileCheck, Image as ImageIcon, User, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { compressImage, formatFileSize } from '../utils/imageCompressor';

const ExcelSurveyImportModal = ({ isOpen, onClose, existingCommodities = [], onSuccess, currentUser }) => {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [headerForm, setHeaderForm] = useState({
    region_id: 'Sikur',
    shop_name: '',
    survey_date: new Date().toISOString().split('T')[0],
    surveyor_name: currentUser?.full_name || '',
    head_of_market_name: '',
    official_doc_url: ''
  });

  // Documentation Photos & Official Doc Upload State
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [officialDocFile, setOfficialDocFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const regionList = [
    'Aikmel', 'Jerowaru', 'Keruak', 'Labuhan Haji', 'Lenek', 'Masbagik',
    'Montong Gading', 'Pringgabaya', 'Pringgasela', 'Sakra', 'Sakra Barat',
    'Sakra Timur', 'Sambelia', 'Selong', 'Sembalun', 'Sikur', 'Sukamulia',
    'Suralaga', 'Suela', 'Terara', 'Wanasaba'
  ];

  // Helper to normalize strings for comparison
  const normalize = (str) => (str || '').toLowerCase().trim();

  // Handle Documentation Photos Selection with compression
  const handleAddDocumentationPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const toastId = toast.loading('Mengompresi foto dokumentasi kegiatan...');
    const compressedList = [];

    for (const file of files) {
      try {
        const comp = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.78,
          mimeType: 'image/webp'
        });
        compressedList.push(comp);
      } catch (err) {
        console.warn('Error compressing photo:', err);
        compressedList.push({
          file,
          previewUrl: URL.createObjectURL(file),
          originalSize: file.size,
          compressedSize: file.size,
          savedPercent: 0,
          name: file.name
        });
      }
    }

    setUploadedPhotos(prev => [...prev, ...compressedList]);
    toast.success(`${compressedList.length} foto berhasil dikompresi!`, { id: toastId });
  };

  const removePhoto = (index) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Official Verification Document Upload
  const handleUploadOfficialDocDirect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Mengompresi & mengunggah dokumen pengesahan...');
    setIsUploadingDoc(true);
    try {
      let fileToUpload = file;
      let preview = null;
      if (file.type.startsWith('image/')) {
        const comp = await compressImage(file, {
          maxWidth: 1800,
          maxHeight: 1800,
          quality: 0.82,
          mimeType: 'image/webp'
        });
        fileToUpload = comp.file;
        preview = comp.previewUrl;
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const { data } = await api.post('/commodities/survey/upload-official-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setHeaderForm(prev => ({ ...prev, official_doc_url: data.url }));
      setOfficialDocFile({
        name: file.name,
        size: file.size,
        url: data.url,
        preview
      });
      toast.success('Dokumen pengesahan berhasil diunggah!', { id: toastId });
    } catch (err) {
      console.error('Error uploading official doc:', err);
      toast.error('Gagal mengunggah dokumen pengesahan.', { id: toastId });
    } finally {
      setIsUploadingDoc(false);
    }
  };

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
    setUploadedPhotos([]);
    setOfficialDocFile(null);
  };

  const handleSubmitImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('Tidak ada baris data valid untuk diimpor.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Memproses Batch Import Excel & Berkas...');

    try {
      let finalPhotoUrls = [];

      // Upload local compressed photos if any
      if (uploadedPhotos.length > 0) {
        setIsUploadingPhotos(true);
        const photoFormData = new FormData();
        uploadedPhotos.forEach(p => {
          photoFormData.append('files', p.file);
        });

        try {
          const { data } = await api.post('/commodities/survey/upload-documentation', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          finalPhotoUrls = (data.uploaded_photos || []).map(p => p.url);
        } catch (photoErr) {
          console.error('Error uploading photos:', photoErr);
          toast.error('Peringatan: Gagal mengunggah beberapa foto dokumentasi, melanjutkan simpan survei.');
        } finally {
          setIsUploadingPhotos(false);
        }
      }

      const payload = {
        region_id: headerForm.region_id,
        shop_name: headerForm.shop_name,
        survey_date: headerForm.survey_date,
        surveyor_name: headerForm.surveyor_name,
        head_of_market_name: headerForm.head_of_market_name || null,
        official_doc_url: headerForm.official_doc_url || null,
        documentation_photos: finalPhotoUrls,
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
      toast.success(res.data.message || `Berhasil mengimpor ${validRows.length} item survei dengan berkas!`, {
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
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] my-auto"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Import Survey Harga Excel
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-Matching
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Unggah file .xlsx survei harga pasar bahan baku sekaligus.</p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar bg-white">

            {/* Template Download Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Download size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Format Template Survei</h4>
                  <p className="text-xs text-slate-500 font-medium">Unduh file template Excel resmi dengan kolom acuan terstandar.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="btn-secondary text-xs shrink-0"
              >
                <Download size={14} /> Download Template (.xlsx)
              </button>
            </div>


            {/* Header Form Settings (Applied to all rows if not explicitly set in Excel) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={13} className="text-blue-600" /> Wilayah / Kecamatan *
                </label>
                <select
                  value={headerForm.region_id}
                  onChange={(e) => setHeaderForm({ ...headerForm, region_id: e.target.value })}
                  className="input text-xs"
                >
                  {regionList.map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 size={13} className="text-blue-600" /> Nama Pasar / Toko
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pasar Sikur"
                  value={headerForm.shop_name}
                  onChange={(e) => setHeaderForm({ ...headerForm, shop_name: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-600" /> Tanggal Survey *
                </label>
                <input
                  type="date"
                  value={headerForm.survey_date}
                  onChange={(e) => setHeaderForm({ ...headerForm, survey_date: e.target.value })}
                  className="input text-xs"
                />
              </div>
            </div>

            {/* Pengesahan & Dokumentasi Kegiatan Survei */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck size={14} className="text-blue-600" /> Pengesahan & Dokumentasi Survei
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Lengkapi penanggung jawab, surat pengesahan pasar, dan foto kegiatan survei.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <User size={13} className="text-slate-400" /> Surveyor Lapangan
                  </label>
                  <input
                    type="text"
                    placeholder="Nama petugas survei"
                    value={headerForm.surveyor_name}
                    onChange={(e) => setHeaderForm({ ...headerForm, surveyor_name: e.target.value })}
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <User size={13} className="text-slate-400" /> Kepala Pasar / P.J Toko
                  </label>
                  <input
                    type="text"
                    placeholder="Nama kepala pasar / pemilik toko"
                    value={headerForm.head_of_market_name}
                    onChange={(e) => setHeaderForm({ ...headerForm, head_of_market_name: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Upload Surat Pengesahan & Foto Dokumentasi Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
                {/* Dokumen Pengesahan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileCheck size={13} className="text-emerald-600" /> Surat / Berkas Pengesahan
                    </span>
                    {headerForm.official_doc_url && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Terunggah
                      </span>
                    )}
                  </label>
                  
                  {officialDocFile ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck size={16} className="text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-900 truncate">{officialDocFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOfficialDocFile(null); setHeaderForm(prev => ({ ...prev, official_doc_url: '' })); }}
                        className="p-1 text-emerald-700 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-2.5 bg-white border border-slate-200 border-dashed hover:border-blue-400 rounded-lg cursor-pointer transition-colors text-xs font-semibold text-slate-600 hover:text-blue-600">
                      <UploadCloud size={15} />
                      <span>{isUploadingDoc ? 'Mengunggah...' : 'Upload Dokumen / Foto Pengesahan'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleUploadOfficialDocDirect}
                        disabled={isUploadingDoc}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Foto Dokumentasi Lapangan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera size={13} className="text-blue-600" /> Foto Dokumentasi Kegiatan
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{uploadedPhotos.length} Foto</span>
                  </label>

                  <label className="flex items-center justify-center gap-2 p-2.5 bg-white border border-slate-200 border-dashed hover:border-blue-400 rounded-lg cursor-pointer transition-colors text-xs font-semibold text-slate-600 hover:text-blue-600">
                    <Camera size={15} />
                    <span>Pilih Foto Dokumentasi Lapangan</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAddDocumentationPhotos}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Photo Previews */}
              {uploadedPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {uploadedPhotos.map((p, idx) => (
                    <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      {p.previewUrl ? (
                        <img src={p.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={16} /></div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus foto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dropzone Upload Area */}
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/10'
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
