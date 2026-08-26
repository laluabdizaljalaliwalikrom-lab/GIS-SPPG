import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Trash2, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Activity,
  History,
  Tag,
  ShieldAlert,
  Download,
  Loader2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

const AuditCenter = () => {
  const { profile } = useOutletContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'prices'
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportItems, setReportItems] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Form states for new price
  const [newPrice, setNewPrice] = useState({
    item_name: '',
    region_id: 'Selong',
    reference_price: '',
    unit: 'kg',
    shop_name: '',
    price_date: new Date().toISOString().split('T')[0]
  });
  const [savingPrice, setSavingPrice] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);

  // Charting state
  const [selectedChartItem, setSelectedChartItem] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Security Role Guard
  const isAuthorized = ['admin', 'kecamatan_coordinator', 'finance_inspector', 'sppg_head'].includes(profile?.role);
  const isAdmin = profile?.role === 'admin';

  const getFilteredCommodities = () => {
    const uniqueNames = [...new Set(marketPrices.map((p) => p.item_name))].sort();
    if (!searchQuery) return uniqueNames;
    return uniqueNames.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const getPointCoords = (index, price) => {
    if (priceHistory.length === 0) return { x: 0, y: 0 };
    const paddingLeft = 60;
    const paddingRight = 40;
    const paddingTop = 40;
    const paddingBottom = 50;
    
    const chartWidth = 600 - paddingLeft - paddingRight;
    const chartHeight = 350 - paddingTop - paddingBottom;
    
    const prices = priceHistory.map(h => h.reference_price);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    
    const range = maxVal - minVal;
    const yMin = range === 0 ? Math.max(0, minVal - 5000) : Math.max(0, minVal - range * 0.15);
    const yMax = range === 0 ? minVal + 5000 : maxVal + range * 0.15;
    
    const x = priceHistory.length > 1 
      ? paddingLeft + (index * chartWidth) / (priceHistory.length - 1) 
      : paddingLeft + chartWidth / 2;
    const y = 350 - paddingBottom - ((price - yMin) * chartHeight) / (yMax - yMin || 1);
    return { x, y };
  };

  const getLinePath = () => {
    if (priceHistory.length < 2) return '';
    return priceHistory
      .map((h, idx) => {
        const coords = getPointCoords(idx, h.reference_price);
        return `${idx === 0 ? 'M' : 'L'} ${coords.x} ${coords.y}`;
      })
      .join(' ');
  };

  const getAreaPath = () => {
    if (priceHistory.length < 2) return '';
    const linePathStr = getLinePath();
    const firstCoords = getPointCoords(0, 0);
    const lastCoords = getPointCoords(priceHistory.length - 1, 0);
    return `${linePathStr} L ${lastCoords.x} 300 L ${firstCoords.x} 300 Z`;
  };

  const getGridLines = () => {
    if (priceHistory.length === 0) return [];
    const prices = priceHistory.map(h => h.reference_price);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    
    const range = maxVal - minVal;
    const yMin = range === 0 ? Math.max(0, minVal - 5000) : Math.max(0, minVal - range * 0.15);
    const yMax = range === 0 ? minVal + 5000 : maxVal + range * 0.15;
    
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const value = yMin + (i * (yMax - yMin)) / 3;
      const coords = getPointCoords(0, value);
      lines.push({ y: coords.y, value });
    }
    return lines;
  };

  const formatRupiahShort = (value) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}jt`;
    }
    if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}k`;
    }
    return `Rp ${value}`;
  };

  // Fetch price history for the selected item
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedChartItem) {
        setPriceHistory([]);
        return;
      }
      setChartLoading(true);
      try {
        const res = await api.get('/audit/market-prices/history', {
          params: { item_name: selectedChartItem }
        });
        setPriceHistory(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Gagal memuat riwayat harga barang.');
      } finally {
        setChartLoading(false);
      }
    };

    if (activeTab === 'chart') {
      fetchHistory();
    }
  }, [selectedChartItem, activeTab]);

  // Auto-select first item when opening chart tab
  useEffect(() => {
    if (activeTab === 'chart' && !selectedChartItem && marketPrices.length > 0) {
      const uniqueNames = [...new Set(marketPrices.map((p) => p.item_name))];
      if (uniqueNames.length > 0) {
        setSelectedChartItem(uniqueNames[0]);
      }
    }
  }, [activeTab, marketPrices, selectedChartItem]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, pricesRes] = await Promise.all([
        api.get('/audit/reports').catch(() => ({ data: [] })),
        api.get('/audit/market-prices').catch(() => ({ data: [] }))
      ]);

      const reportData = Array.isArray(reportsRes?.data) ? reportsRes.data : [];
      const priceData = Array.isArray(pricesRes?.data) ? pricesRes.data : [];

      setReports(reportData);
      setMarketPrices(priceData);
      
      // Select the latest report if available
      if (reportData.length > 0 && !selectedReport) {
        await loadReportDetails(reportData[0].id);
      }
    } catch (error) {
      console.error("Error in AuditCenter fetchData:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedReport]);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized, fetchData]);

  const loadReportDetails = async (reportId) => {
    if (!reportId) return;
    try {
      const res = await api.get(`/audit/reports/${reportId}`);
      setSelectedReport(res.data);
      setReportItems(res.data.items || []);
    } catch (error) {
      console.error("Error loading report details:", error);
      if (error.response?.status === 404) {
        setSelectedReport(null);
        setReportItems([]);
      }
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      toast.error('Format file tidak didukung. Harap unggah gambar (JPG/PNG) atau PDF.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Mengunggah dokumen & menjalankan OCR...', {
      style: {
        borderRadius: '1.5rem',
        background: '#0f172a',
        color: '#fff',
        fontWeight: 'bold',
        padding: '1rem'
      }
    });

    try {
      // Simulate progress bar increments
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 500);

      const res = await api.post('/audit/upload', formData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Scan RAB/Nota Berhasil!', { id: toastId, icon: '🔍', duration: 4000 });
      
      // Update local state
      setReports((prev) => [res.data, ...prev]);
      setSelectedReport(res.data);
      setReportItems(res.data.items || []);
      
      // Re-fetch database reference items to ensure logs are correct
      const pricesRes = await api.get('/audit/market-prices');
      setMarketPrices(pricesRes.data);
      
      // Invalidate TanStack query cache for commodities
      queryClient.invalidateQueries({ queryKey: ['commodity-items'] });
      queryClient.invalidateQueries({ queryKey: ['commodity-prices'] });
      queryClient.invalidateQueries({ queryKey: ['latest-prices'] });
      
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Gagal memproses dokumen audit.', { id: toastId });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 800);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!isAdmin) {
      toast.error('Hanya Admin yang dapat menghapus laporan audit.');
      return;
    }

    if (!window.confirm('Yakin ingin menghapus laporan audit ini secara permanen?')) return;

    try {
      await api.delete(`/audit/reports/${reportId}`);
      toast.success('Laporan berhasil dihapus.');
      
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
        setReportItems([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus laporan.');
    }
  };

  const handleAddPrice = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Hanya Admin yang dapat mengubah harga referensi.');
      return;
    }

    if (!newPrice.item_name || !newPrice.reference_price) {
      toast.error('Harap isi nama item dan harga referensi.');
      return;
    }

    setSavingPrice(true);
    try {
      const payload = {
        ...newPrice,
        reference_price: parseFloat(newPrice.reference_price)
      };

      const res = await api.post('/audit/market-prices', payload);
      toast.success('Harga referensi berhasil disimpan!');
      
      // Invalidate TanStack query cache for commodities
      queryClient.invalidateQueries({ queryKey: ['commodity-items'] });
      queryClient.invalidateQueries({ queryKey: ['commodity-prices'] });
      queryClient.invalidateQueries({ queryKey: ['latest-prices'] });
      
      // Update list by matching id instead of item_name (to support history and duplicates)
      setMarketPrices((prev) => {
        const exists = prev.some((p) => p.id === res.data.id);
        if (exists) {
          return prev.map((p) => p.id === res.data.id ? res.data : p);
        }
        return [...prev, res.data].sort((a, b) => a.item_name.localeCompare(b.item_name));
      });

      // Reset form
      setNewPrice({
        item_name: '',
        region_id: 'Selong',
        reference_price: '',
        unit: 'kg',
        shop_name: '',
        price_date: new Date().toISOString().split('T')[0]
      });
      setEditingPriceId(null);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan harga referensi.');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleEditPriceClick = (price) => {
    setNewPrice({
      item_name: price.item_name,
      region_id: price.region_id || 'Selong',
      reference_price: price.reference_price.toString(),
      unit: price.unit,
      shop_name: price.shop_name || '',
      price_date: price.price_date ? price.price_date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setEditingPriceId(price.id);
  };

  const handleCancelPriceEdit = () => {
    setEditingPriceId(null);
    setNewPrice({
      item_name: '',
      region_id: 'Selong',
      reference_price: '',
      unit: 'kg',
      shop_name: '',
      price_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeletePrice = async (priceId) => {
    if (!isAdmin) {
      toast.error('Hanya Admin yang dapat menghapus harga referensi.');
      return;
    }

    if (!window.confirm('Yakin ingin menghapus acuan harga ini?')) return;

    try {
      await api.delete(`/audit/market-prices/${priceId}`);
      toast.success('Acuan harga berhasil dihapus!');
      
      setMarketPrices((prev) => prev.filter((p) => p.id !== priceId));
      if (editingPriceId === priceId) {
        handleCancelPriceEdit();
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus acuan harga.');
    }
  };


  const handleExportExcel = () => {
    if (!selectedReport || reportItems.length === 0) {
      toast.error('Tidak ada data audit untuk diexport.');
      return;
    }

    // Format data for sheet
    const data = reportItems.map((item, index) => {
      const matchedRef = marketPrices.find((p) => p.item_name.toLowerCase() === item.item_name.toLowerCase());
      const refPrice = matchedRef ? matchedRef.reference_price : item.market_price;
      const markup = refPrice > 0 ? (((item.price_per_unit - refPrice) / refPrice) * 100) : 0;
      
      return {
        'No': index + 1,
        'Nama Item': item.item_name,
        'Quantity': item.qty,
        'Harga Nota (Rp)': item.price_per_unit,
        'Harga Acuan Pasar (Rp)': item.market_price,
        'Markup %': markup > 0 ? `${markup.toFixed(1)}%` : '0%',
        'Potensi Pemborosan (Rp)': item.potential_loss
      };
    });

    // Add empty rows and total
    data.push({});
    data.push({
      'Nama Item': 'TOTAL POTENSI KERUGIAN',
      'Potensi Pemborosan (Rp)': selectedReport.total_potential_loss
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Audit");

    // Auto-fit column widths
    const max_widths = [5, 25, 12, 18, 22, 12, 24];
    worksheet['!cols'] = max_widths.map(w => ({ wch: w }));

    const dateStr = new Date(selectedReport.created_at).toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Smart_Audit_Loss_Report_${selectedReport.id}_${dateStr}.xlsx`);
    toast.success('Laporan berhasil diunduh dalam format Excel!');
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-white border border-red-100 rounded-3xl max-w-xl mx-auto mt-12 shadow-xl">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Akses Ditolak</h2>
        <p className="text-slate-500 mt-2 font-medium">Anda tidak memiliki hak akses yang cukup untuk membuka fitur Smart Audit Center. Silakan hubungi Administrator sistem.</p>
      </div>
    );
  }

  // Get status details
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DANGER':
        return { label: 'Bahaya', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: AlertTriangle };
      case 'WARNING':
        return { label: 'Waspada', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: AlertTriangle };
      case 'NORMAL':
      default:
        return { label: 'Aman', color: 'bg-sky-50 text-sky-600 border-sky-100', icon: CheckCircle };
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'DANGER': return 'border-rose-200 bg-rose-50/20 text-rose-700';
      case 'WARNING': return 'border-amber-200 bg-amber-50/20 text-amber-700';
      case 'NORMAL':
      default:
        return 'border-sky-200 bg-sky-50/20 text-sky-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">Smart Audit Center</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm lg:text-base mt-1">Audit markup harga nota secara otomatis dengan model Vision OCR.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="flex items-center gap-2"><Activity size={14} /> Audit Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'prices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="flex items-center gap-2"><Tag size={14} /> Referensi Harga</span>
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="flex items-center gap-2"><TrendingUp size={14} /> Tren Harga</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] bg-white rounded-[2rem] border border-blue-50 flex items-center justify-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-slate-400 font-bold text-sm">Memuat modul audit...</p>
          </div>
        </div>
      ) : activeTab === 'dashboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Drag & Drop Scanner & History list */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Document Scanner Area */}
            <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wider text-blue-600 flex items-center gap-2">
                <UploadCloud size={18} /> Unggah Nota/RAB
              </h2>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' 
                    : 'border-blue-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/10'
                }`}
              >
                <input 
                  type="file" 
                  id="audit-file-upload" 
                  className="hidden" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                
                {isUploading ? (
                  <div className="w-full space-y-4 py-4">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">Menganalisis Dokumen...</p>
                      <p className="text-xs text-slate-400">Menjalankan parser Vision AI</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="bg-blue-600 h-full rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ) : (
                  <label htmlFor="audit-file-upload" className="cursor-pointer space-y-4 py-4 w-full block">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                      <UploadCloud size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">Tarik & lepas file di sini</p>
                      <p className="text-xs text-slate-400">atau klik untuk menelusuri file</p>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Format: PNG, JPG, JPEG, PDF (Maks 10MB)
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Past Audits History */}
            <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <History size={18} /> Riwayat Audit
                </h2>
                <span className="text-[11px] font-bold text-slate-400">Total: {reports.length}</span>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'DANGER', label: '🔴 Bahaya' },
                  { key: 'WARNING', label: '🟡 Waspada' },
                  { key: 'NORMAL', label: '🟢 Aman' }
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                      statusFilter === st.key
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[360px] pr-2 no-scrollbar">
                {reports.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-slate-400 font-bold text-xs">Belum ada riwayat audit</p>
                  </div>
                ) : (
                  reports
                    .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
                    .map((report) => {
                      const isActive = selectedReport?.id === report.id;
                      const badge = getStatusBadge(report.status);
                      const BadgeIcon = badge.icon;
                      
                      return (
                        <div 
                          key={report.id}
                          onClick={() => loadReportDetails(report.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${
                            isActive 
                              ? 'border-blue-600 bg-blue-50/40 shadow-md shadow-blue-200/20 ring-2 ring-blue-500/20' 
                              : 'border-slate-100 hover:border-blue-200 bg-white hover:shadow-sm'
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400">
                              {new Date(report.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                            <p className="text-xs font-black text-slate-700 truncate">
                              ID: #{report.id} • {report.total_items} Barang
                            </p>
                            {report.sppg_name && (
                              <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                {report.sppg_name}
                              </span>
                            )}
                            <p className="text-sm font-black text-slate-800">
                              {formatRupiah(report.total_potential_loss)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase tracking-tight flex items-center gap-1 ${badge.color}`}>
                              <BadgeIcon size={12} />
                              {badge.label}
                            </div>
                            
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReport(report.id);
                                }}
                                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

          </div>

          {/* Right Columns (2 spans): Summary Cards & Active Scan details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* If no report is selected */}
            {!selectedReport ? (
              <div className="min-h-[500px] bg-white rounded-[2rem] border border-blue-50 shadow-sm flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
                  <FileSpreadsheet size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Belum Ada Laporan Terpilih</h3>
                <p className="text-slate-400 mt-2 max-w-md font-medium text-sm">Silakan unggah RAB/Nota belanja baru atau pilih salah satu laporan audit dari daftar riwayat untuk meninjau detail potensi kerugian.</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Total Loss */}
                  <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                      <DollarSign size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kerugian Terdeteksi</p>
                      <h3 className="text-xl font-black text-rose-600 mt-1 truncate">
                        {formatRupiah(selectedReport.total_potential_loss)}
                      </h3>
                    </div>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50/30 rounded-full blur-2xl -mr-8 -mt-8" />
                  </div>

                  {/* Card 2: Total Items */}
                  <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Activity size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Di-Audit</p>
                      <h3 className="text-xl font-black text-slate-800 mt-1">
                        {selectedReport.total_items} Barang
                      </h3>
                    </div>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/30 rounded-full blur-2xl -mr-8 -mt-8" />
                  </div>

                  {/* Card 3: Risk Level */}
                  {(() => {
                    const badge = getStatusBadge(selectedReport.status);
                    const BadgeIcon = badge.icon;
                    return (
                      <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          selectedReport.status === 'DANGER' ? 'bg-rose-50 text-rose-600' :
                          selectedReport.status === 'WARNING' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'
                        }`}>
                          <BadgeIcon size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tingkat Risiko</p>
                          <h3 className={`text-xl font-black mt-1 ${
                            selectedReport.status === 'DANGER' ? 'text-rose-600' :
                            selectedReport.status === 'WARNING' ? 'text-amber-600' : 'text-sky-600'
                          }`}>
                            {badge.label}
                          </h3>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Audit Details Results Table */}
                <div className="bg-white rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-blue-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-800 tracking-tight">Rincian Markup Detail</h2>
                      <p className="text-slate-400 font-medium text-xs mt-0.5">Ditemukan dari hasil OCR dokumen nota / RAB yang diunggah.</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {selectedReport.doc_url && (
                        <a 
                          href={selectedReport.doc_url.startsWith('http') ? selectedReport.doc_url : `${api.defaults.baseURL.replace('/api', '')}${selectedReport.doc_url}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          <Download size={14} /> Lihat File Asli
                        </a>
                      )}
                      
                      <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-100 transition-all animate-in"
                      >
                        <FileSpreadsheet size={14} /> Export Excel
                      </button>
                    </div>
                  </div>

                  {/* Table Component */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-blue-50">
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Nama Barang</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Qty</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Harga Nota</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Harga Acuan</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Markup (%)</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Potensi Kerugian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportItems.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-12 text-slate-400 font-bold text-sm">
                              Tidak ada barang yang diekstrak
                            </td>
                          </tr>
                        ) : (
                          reportItems.map((item) => {
                            const isMarkup = item.potential_loss > 0;
                            const markupPct = item.market_price > 0 ? (((item.price_per_unit - item.market_price) / item.market_price) * 100) : 0;
                            
                            // Highlight if potential loss > 0 AND markup is significant (e.g. >15%)
                            const highlightClass = isMarkup && markupPct > 15.0 
                              ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500' 
                              : isMarkup && markupPct >= 5.0
                                ? 'bg-amber-50/20 hover:bg-amber-50/40'
                                : 'hover:bg-slate-50/50';

                            return (
                              <tr key={item.id} className={`transition-colors ${highlightClass}`}>
                                <td className="px-6 py-4.5 font-bold text-slate-800 text-sm">
                                  {item.item_name}
                                </td>
                                <td className="px-6 py-4.5 text-center font-bold text-slate-600 text-sm">
                                  {item.qty}
                                </td>
                                <td className="px-6 py-4.5 text-right font-bold text-slate-700 text-sm">
                                  {formatRupiah(item.price_per_unit)}
                                </td>
                                <td className="px-6 py-4.5 text-right font-medium text-slate-400 text-sm">
                                  {formatRupiah(item.market_price)}
                                </td>
                                <td className="px-6 py-4.5 text-center font-black text-sm">
                                  {isMarkup ? (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                                      markupPct > 15.0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      <TrendingUp size={12} />
                                      {markupPct.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-medium text-xs">0%</span>
                                  )}
                                </td>
                                <td className={`px-6 py-4.5 text-right font-black text-sm ${isMarkup ? 'text-rose-600' : 'text-slate-400'}`}>
                                  {isMarkup ? formatRupiah(item.potential_loss) : '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      ) : activeTab === 'prices' ? (
        /* TAB: Reference prices management */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form to add reference price (restricted to Admin) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <Plus size={18} /> Acuan Harga Baru
                </h2>
                <p className="text-slate-400 text-xs font-medium">Tambah atau ubah harga referensi pasar komoditas gizi.</p>
              </div>

              {isAdmin ? (
                <form onSubmit={handleAddPrice} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Barang</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Beras, Telur Ayam"
                      disabled={editingPriceId !== null}
                      value={newPrice.item_name}
                      onChange={(e) => setNewPrice((prev) => ({ ...prev, item_name: e.target.value }))}
                      className={`w-full px-4 py-3.5 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm ${
                        editingPriceId !== null 
                          ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                    {editingPriceId !== null && (
                      <p className="text-[10px] text-amber-600 font-bold ml-1">
                        * Nama barang tidak dapat diubah saat mode edit. Hapus dan buat baru jika ingin mengganti nama.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Satuan Unit</label>
                      <select
                        value={newPrice.unit}
                        onChange={(e) => setNewPrice((prev) => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm appearance-none"
                      >
                        <optgroup label="Satuan Berat (Massa)">
                          <option value="kg">Kilogram (kg)</option>
                          <option value="gr">Gram (gr)</option>
                          <option value="ton">Ton</option>
                          <option value="kwintal">Kwintal (100 kg)</option>
                        </optgroup>
                        <optgroup label="Satuan Volume (Cairan)">
                          <option value="liter">Liter (L)</option>
                          <option value="ml">Mililiter (ml)</option>
                          <option value="galon">Galon</option>
                        </optgroup>
                        <optgroup label="Satuan Kuantitas (Jumlah)">
                          <option value="pcs">Pcs (Pieces/Buah)</option>
                          <option value="butir">Butir</option>
                          <option value="sachet">Sachet</option>
                          <option value="pack">Pack / Bungkus</option>
                        </optgroup>
                        <optgroup label="Satuan Kemasan Besar (Grosir)">
                          <option value="koli">Koli (Karung/Peti/Dus)</option>
                          <option value="dus">Kardus / Dus</option>
                          <option value="karung">Karung (Sak)</option>
                          <option value="lusin">Lusin (12 pcs)</option>
                          <option value="kodi">Kodi (20 pcs)</option>
                          <option value="gross">Gross (144 pcs)</option>
                        </optgroup>
                        <optgroup label="Satuan Panjang/Luas">
                          <option value="m">Meter (m)</option>
                          <option value="m2">Meter Persegi (m²)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Wilayah (Kecamatan)</label>
                      <select
                        value={newPrice.region_id}
                        onChange={(e) => setNewPrice((prev) => ({ ...prev, region_id: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm appearance-none"
                      >
                        <option value="Aikmel">Aikmel</option>
                        <option value="Jerowaru">Jerowaru</option>
                        <option value="Keruak">Keruak</option>
                        <option value="Labuhan Haji">Labuhan Haji</option>
                        <option value="Lenek">Lenek</option>
                        <option value="Masbagik">Masbagik</option>
                        <option value="Montong Gading">Montong Gading</option>
                        <option value="Pringgabaya">Pringgabaya</option>
                        <option value="Pringgasela">Pringgasela</option>
                        <option value="Sakra">Sakra</option>
                        <option value="Sakra Barat">Sakra Barat</option>
                        <option value="Sakra Timur">Sakra Timur</option>
                        <option value="Sambelia">Sambelia</option>
                        <option value="Selong">Selong (Pusat Pemerintahan)</option>
                        <option value="Sembalun">Sembalun</option>
                        <option value="Sikur">Sikur</option>
                        <option value="Sukamulia">Sukamulia</option>
                        <option value="Suralaga">Suralaga</option>
                        <option value="Suela">Suela (Suwela)</option>
                        <option value="Terara">Terara</option>
                        <option value="Wanasaba">Wanasaba</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nama Toko (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Toko Barokah"
                        value={newPrice.shop_name}
                        onChange={(e) => setNewPrice((prev) => ({ ...prev, shop_name: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Tanggal Acuan</label>
                      <input
                        type="date"
                        required
                        value={newPrice.price_date}
                        onChange={(e) => setNewPrice((prev) => ({ ...prev, price_date: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Harga Acuan (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="14000"
                      value={newPrice.reference_price}
                      onChange={(e) => setNewPrice((prev) => ({ ...prev, reference_price: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    {editingPriceId !== null && (
                      <button
                        type="button"
                        onClick={handleCancelPriceEdit}
                        className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl transition-all uppercase tracking-widest text-xs"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingPrice}
                      className={`font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs ${
                        editingPriceId !== null 
                          ? 'flex-[2] py-4 bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100 hover:shadow-amber-200' 
                          : 'w-full py-4 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300'
                      }`}
                    >
                      {savingPrice ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>{editingPriceId !== null ? "Simpan Perubahan" : "Simpan Acuan Harga"}</>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-amber-100 rounded-2xl bg-amber-50/10 text-amber-700">
                  <ShieldAlert size={28} className="mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold">Hanya Admin yang dapat menambahkan atau mengedit harga referensi pasar.</p>
                </div>
              )}
            </div>
          </div>

          {/* Reference prices table (viewable by everyone) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-blue-50">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Daftar Acuan Pasar Aktif</h2>
                <p className="text-slate-400 font-medium text-xs mt-0.5">Daftar komoditas yang dicocokkan otomatis saat melakukan audit.</p>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-blue-50">
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Nama Barang</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Wilayah</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Unit</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-left">Toko</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Tanggal</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Harga Referensi</th>
                      {isAdmin && <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marketPrices.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-slate-400 font-bold text-sm">
                          Belum ada data referensi harga pasar.
                        </td>
                      </tr>
                    ) : (
                      marketPrices.map((price) => (
                        <tr key={price.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                            {price.item_name}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-500 text-xs">
                            {price.region_id || '-'}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600 text-xs">
                            {price.unit}
                          </td>
                          <td className="px-6 py-4 text-left text-slate-600 text-sm font-medium">
                            {price.shop_name || '-'}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-500 text-xs font-bold">
                            {price.price_date ? new Date(price.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-800 text-sm">
                            {formatRupiah(price.reference_price)}
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 text-center space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => handleEditPriceClick(price)}
                                className={`p-2 rounded-xl transition-all ${
                                  editingPriceId === price.id 
                                    ? 'text-amber-600 bg-amber-50' 
                                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title="Edit acuan harga"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePrice(price.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Hapus acuan harga"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* TAB: Price Trend Chart */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List of commodities */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wider text-blue-600 flex items-center gap-2">
                  <TrendingUp size={18} /> Pilih Komoditas
                </h2>
                <p className="text-slate-400 text-xs font-medium">Pilih barang untuk melihat grafik tren harga dari waktu ke waktu.</p>
              </div>
              
              <input
                type="text"
                placeholder="Cari komoditas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-xs font-medium"
              />
              
              <div className="space-y-2 overflow-y-auto max-h-[350px] pr-2 no-scrollbar">
                {getFilteredCommodities().map((item_name) => {
                  const isActive = selectedChartItem === item_name;
                  return (
                    <button
                      key={item_name}
                      onClick={() => setSelectedChartItem(item_name)}
                      className={`w-full p-4 rounded-2xl border text-left font-bold text-sm transition-all ${
                        isActive
                          ? 'border-blue-600 bg-blue-50/30 text-blue-700 shadow-sm'
                          : 'border-slate-100 hover:border-blue-200 bg-slate-50/30 text-slate-700'
                      }`}
                    >
                      {item_name}
                    </button>
                  );
                })}
                {getFilteredCommodities().length === 0 && (
                  <p className="text-center text-xs text-slate-400 font-medium py-6">Komoditas tidak ditemukan</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Chart Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm relative flex flex-col min-h-[400px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Visualisasi Tren Harga: <span className="text-blue-600">{selectedChartItem}</span>
                  </h2>
                  <p className="text-slate-400 font-medium text-xs mt-0.5">Grafik pergerakan harga referensi pasar berdasarkan histori input.</p>
                </div>
              </div>
              
              {chartLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <p className="text-slate-400 font-bold text-xs">Memuat data histori...</p>
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <TrendingUp size={48} className="text-slate-200 mb-4" />
                  <p className="font-bold text-sm">Tidak Ada Histori Harga</p>
                  <p className="text-xs max-w-sm mt-1">Belum ada data riwayat perubahan harga untuk barang "{selectedChartItem}". Silakan tambah harga baru dengan tanggal berbeda.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-6 relative">
                  {/* Custom SVG Line Chart Wrapper */}
                  <div className="relative w-full overflow-hidden border border-slate-50 rounded-2xl p-4 bg-slate-50/20">
                    <svg viewBox="0 0 600 350" className="w-full h-auto overflow-visible select-none">
                      <defs>
                        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      {getGridLines().map((line, idx) => (
                        <g key={idx}>
                          <line
                            x1="60"
                            y1={line.y}
                            x2="560"
                            y2={line.y}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="50"
                            y={line.y + 4}
                            textAnchor="end"
                            className="fill-slate-400 text-[10px] font-bold font-mono"
                          >
                            {formatRupiahShort(line.value)}
                          </text>
                        </g>
                      ))}
                      
                      {/* X Axis Line */}
                      <line x1="60" y1="300" x2="560" y2="300" stroke="#cbd5e1" strokeWidth="1.5" />
                      
                      {/* X Axis Labels */}
                      {priceHistory.map((h, idx) => {
                        const coords = getPointCoords(idx, h.reference_price);
                        return (
                          <g key={h.id}>
                            <line
                              x1={coords.x}
                              y1="300"
                              x2={coords.x}
                              y2="304"
                              stroke="#cbd5e1"
                              strokeWidth="1.5"
                            />
                            <text
                              x={coords.x}
                              y="320"
                              textAnchor="middle"
                              className="fill-slate-400 text-[9px] font-black tracking-tight"
                            >
                              {h.price_date ? new Date(h.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Area Fill */}
                      {getAreaPath() && (
                        <path
                          d={getAreaPath()}
                          fill="url(#chart-area-grad)"
                        />
                      )}
                      
                      {/* Connection Line */}
                      {getLinePath() && (
                        <path
                          d={getLinePath()}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      
                      {/* Data Dots */}
                      {priceHistory.map((h, idx) => {
                        const coords = getPointCoords(idx, h.reference_price);
                        const isHovered = hoveredPoint?.id === h.id;
                        return (
                          <circle
                            key={h.id}
                            cx={coords.x}
                            cy={coords.y}
                            r={isHovered ? 7 : 5.5}
                            fill={isHovered ? '#2563eb' : '#ffffff'}
                            stroke="#2563eb"
                            strokeWidth="3"
                            className="transition-all duration-150 cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ ...h, x: coords.x, y: coords.y })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Tooltip Overlay */}
                    {hoveredPoint && (
                      <div
                        className="absolute bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1 z-10 pointer-events-none transition-all duration-100"
                        style={{
                          left: `${(hoveredPoint.x / 600) * 100}%`,
                          top: `${(hoveredPoint.y / 350) * 100}%`,
                          transform: 'translate(-50%, -120%)'
                        }}
                      >
                        <p className="font-black text-[9px] text-blue-400 uppercase tracking-widest">
                          {hoveredPoint.shop_name || 'Toko Tidak Tercatat'}
                        </p>
                        <p className="font-black text-sm text-slate-100">{formatRupiah(hoveredPoint.reference_price)} / {hoveredPoint.unit}</p>
                        <p className="text-slate-400 text-[9px] font-bold">
                          {hoveredPoint.price_date ? new Date(hoveredPoint.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        </p>
                        {hoveredPoint.region_id && (
                          <p className="text-slate-500 text-[9px] font-bold">Wilayah: {hoveredPoint.region_id}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Detailed price history list log */}
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                      <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Tabel Riwayat Perubahan Harga</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/20 border-b border-slate-100">
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Toko</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Wilayah</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Satuan</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Harga</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...priceHistory].reverse().map((h) => (
                            <tr key={h.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-3.5 text-xs font-bold text-slate-600">
                                {h.price_date ? new Date(h.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                              </td>
                              <td className="px-6 py-3.5 text-xs font-medium text-slate-700">
                                {h.shop_name || '-'}
                              </td>
                              <td className="px-6 py-3.5 text-xs font-medium text-slate-500">
                                {h.region_id || '-'}
                              </td>
                              <td className="px-6 py-3.5 text-xs font-bold text-slate-600 text-center">
                                {h.unit}
                              </td>
                              <td className="px-6 py-3.5 text-xs font-black text-slate-800 text-right">
                                {formatRupiah(h.reference_price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditCenter;
