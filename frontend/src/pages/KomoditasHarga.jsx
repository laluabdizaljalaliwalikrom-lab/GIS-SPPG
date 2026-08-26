import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useKomoditas } from '../hooks/useKomoditas';
import api from '../api';
import {
  TrendingUp, History, Package,
  Plus, Trash2, Edit2, Download,
  Loader2, ShoppingCart, Save,
  BarChart3, Database, User,
  FileSpreadsheet, Globe, ExternalLink, RefreshCw,
  Radio, ArrowUpRight, ArrowDownRight, Minus,
  CandlestickChart, TrendingDown, LayoutGrid, List, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import FormModal from '../components/FormModal';
import SearchableCommoditySelect from '../components/SearchableCommoditySelect';
import ExcelSurveyImportModal from '../components/ExcelSurveyImportModal';

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

const formatRupiahShort = (value) => {
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}k`;
  return `Rp ${value}`;
};

const UNIT_CATEGORIES = [
  { label: 'Berat (Massa)', units: ['kg', 'gram', 'ons', 'kuintal', 'ton'] },
  { label: 'Volume (Cairan)', units: ['liter', 'ml', 'galon', 'botol', 'kaleng'] },
  { label: 'Kemasan & Wadah', units: ['karung', 'dus/karton', 'pack', 'bal', 'sachet', 'tray', 'keranjang', 'kotak'] },
  { label: 'Jumlah & Porsi', units: ['pcs', 'butir', 'buah', 'ikat', 'porsi', 'piring'] },
  { label: 'Gas & Lainnya', units: ['tabung', 'batang', 'lembar'] },
];

const KomoditasHarga = () => {
  const { profile } = useOutletContext();
  const queryClient = useQueryClient();
  const {
    items = [], loadingItems,
    createItem, updateItem, deleteItem,
    isCreating, isUpdating,
    latestPrices = [], loadingPrices,
    allPrices = [],
    submitSurvey, isSubmitting,
  } = useKomoditas();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedChartItem, setSelectedChartItem] = useState('');
  const [selectedInspectorItem, setSelectedInspectorItem] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);

  // Disperindag NTB Live Prices State
  const [ntbLivePrices, setNtbLivePrices] = useState([]);
  const [loadingLiveNtb, setLoadingLiveNtb] = useState(false);
  const [selectedNtbCategory, setSelectedNtbCategory] = useState('SEMUA');
  const [ntbSearchQuery, setNtbSearchQuery] = useState('');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [selectedNtbItem, setSelectedNtbItem] = useState(null);
  const [ntbLastUpdate, setNtbLastUpdate] = useState(null);
  const [loadingNtbHistory, setLoadingNtbHistory] = useState(false);
  const [ntbViewMode, setNtbViewMode] = useState('grid');

  const fetchNtbLivePrices = async () => {
    setLoadingLiveNtb(true);
    try {
      const res = await api.get('/commodities/disperindag-ntb-live');
      setNtbLivePrices(res.data);
      setNtbLastUpdate(new Date());
    } catch {
      toast.error('Gagal memuat live data harga Disperindag NTB.');
    } finally {
      setLoadingLiveNtb(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitial = async () => {
      try {
        const res = await api.get('/commodities/disperindag-ntb-live');
        if (cancelled) return;
        setNtbLivePrices(res.data);
        setNtbLastUpdate(new Date());
      } catch {
        if (!cancelled) toast.error('Gagal memuat live data harga Disperindag NTB.');
      }
    };
    loadInitial();
    return () => { cancelled = true; };
  }, []);

  const selectNtbItem = async (item) => {
    setSelectedNtbItem(item);
    setLoadingNtbHistory(true);
    setPriceHistory([]);
    try {
      const res = await api.get('/audit/market-prices/history', { params: { item_name: item.komoditas } });
      setPriceHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPriceHistory([]);
    } finally {
      setLoadingNtbHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'ntb-live') return;
    const interval = setInterval(() => {
      fetchNtbLivePrices();
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedNtbItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [selectedNtbItem]);

  const ntbCategories = ['SEMUA', 'Bahan Pokok', 'Daging & Unggas', 'Telur & Susu', 'Bumbu & Sayuran', 'Minyak & Lemak', 'Gula & Pemanis', 'Ikan & Laut', 'Gas & Energi'];

  const getPrevPrice = (item) => {
    const pct = item.perubahan ?? 0;
    if (pct === 0) return item.harga_ntb;
    return item.harga_ntb / (1 + pct / 100);
  };

  const getChangeRp = (item) => item.harga_ntb - getPrevPrice(item);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [itemForm, setItemForm] = useState({ nama: '', kategori: '', satuan_default: 'kg', deskripsi: '', is_active: true });

  const [surveyForm, setSurveyForm] = useState({
    survey_session_id: `SURVEY-${new Date().getTime()}`,
    survey_date: new Date().toISOString().split('T')[0],
    region_id: 'Sikur',
    shop_name: '',
    surveyor_name: profile?.full_name || '',
  });
  const [surveyItems, setSurveyItems] = useState([]);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [surveySessions, setSurveySessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [sessionItems, setSessionItems] = useState({});
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editPriceForm, setEditPriceForm] = useState({ item_name: '', reference_price: '', unit: 'kg', supplier_name: '' });

  const isAuthorized = ['admin', 'kecamatan_coordinator', 'finance_inspector', 'sppg_head'].includes(profile?.role);
  const isAdmin = profile?.role === 'admin';

  const kategoriList = [
    'Beras', 'Lauk', 'Sayur', 'Buah', 'Susu', 'Minyak', 'Bumbu', 'Gas', 'Air', 'Lainnya'
  ];

  const regionList = [
    'Aikmel', 'Jerowaru', 'Keruak', 'Labuhan Haji', 'Lenek', 'Masbagik',
    'Montong Gading', 'Pringgabaya', 'Pringgasela', 'Sakra', 'Sakra Barat',
    'Sakra Timur', 'Sambelia', 'Selong', 'Sembalun', 'Sikur', 'Sukamulia',
    'Suralaga', 'Suela', 'Terara', 'Wanasaba'
  ];

  useEffect(() => {
    if (!selectedChartItem) return;
    let cancelled = false;
    const params = { item_name: selectedChartItem };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    api.get('/audit/market-prices/history', { params })
      .then(res => { if (!cancelled) setPriceHistory(res.data); })
      .catch(() => { if (!cancelled) toast.error('Gagal memuat riwayat harga.'); });
    return () => { cancelled = true; };
  }, [selectedChartItem, dateFrom, dateTo]);

  const getFilteredItems = () => {
    if (!searchQuery) return items;
    return items.filter(i =>
      i.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.kategori || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getChartCoords = (index, price) => {
    if (priceHistory.length === 0) return { x: 0, y: 0 };
    const padL = 60, padR = 40, padT = 40, padB = 50;
    const cw = 600 - padL - padR, ch = 350 - padT - padB;
    const prices = priceHistory.map(h => h.reference_price);
    const minVal = Math.min(...prices), maxVal = Math.max(...prices);
    const range = maxVal - minVal;
    const yMin = range === 0 ? Math.max(0, minVal - 5000) : Math.max(0, minVal - range * 0.15);
    const yMax = range === 0 ? minVal + 5000 : maxVal + range * 0.15;
    const x = priceHistory.length > 1
      ? padL + (index * cw) / (priceHistory.length - 1)
      : padL + cw / 2;
    const y = 350 - padB - ((price - yMin) * ch) / (yMax - yMin || 1);
    return { x, y };
  };

  const getLinePath = () => {
    if (priceHistory.length < 2) return '';
    return priceHistory.map((h, idx) => {
      const c = getChartCoords(idx, h.reference_price);
      return `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`;
    }).join(' ');
  };

  const getAreaPath = () => {
    if (priceHistory.length < 2) return '';
    const line = getLinePath();
    const first = getChartCoords(0, 0);
    const last = getChartCoords(priceHistory.length - 1, 0);
    return `${line} L ${last.x} 300 L ${first.x} 300 Z`;
  };

  const getGridLines = () => {
    if (priceHistory.length === 0) return [];
    const prices = priceHistory.map(h => h.reference_price);
    const minVal = Math.min(...prices), maxVal = Math.max(...prices);
    const range = maxVal - minVal;
    const yMin = range === 0 ? Math.max(0, minVal - 5000) : Math.max(0, minVal - range * 0.15);
    const yMax = range === 0 ? minVal + 5000 : maxVal + range * 0.15;
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const value = yMin + (i * (yMax - yMin)) / 3;
      const c = getChartCoords(0, value);
      lines.push({ y: c.y, value });
    }
    return lines;
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemForm.nama || !itemForm.satuan_default) {
      toast.error('Harap isi nama dan satuan default.');
      return;
    }
    try {
      if (editItemId) {
        await updateItem({ id: editItemId, data: itemForm });
      } else {
        await createItem(itemForm);
      }
      closeModal();
    } catch {
      // error handled by mutation onError
    }
  };

  const resetItemForm = () => {
    setItemForm({ nama: '', kategori: '', satuan_default: 'kg', deskripsi: '', is_active: true });
    setEditItemId(null);
  };

  const openAddItem = () => {
    resetItemForm();
    setShowModal(true);
  };

  const openEditItem = (item) => {
    setItemForm({
      nama: item.nama,
      kategori: item.kategori || '',
      satuan_default: item.satuan_default,
      deskripsi: item.deskripsi || '',
      is_active: item.is_active ?? true,
    });
    setEditItemId(item.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetItemForm();
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Yakin ingin menghapus komoditas ini?')) return;
    try {
      await deleteItem(id);
    } catch {
      // error handled by mutation onError
    }
  };

  const addSurveyItemRow = () => {
    setSurveyItems([...surveyItems, {
      tempId: Date.now(),
      commodity_item_id: null,
      item_name: '',
      reference_price: '',
      unit: 'kg',
      custom_unit: '',
      qty: 1,
      supplier_name: '',
      notes: '',
    }]);
  };

  const removeSurveyItem = (tempId) => {
    setSurveyItems(surveyItems.filter(i => i.tempId !== tempId));
  };

  const updateSurveyItem = (tempId, field, value) => {
    setSurveyItems(surveyItems.map(i =>
      i.tempId === tempId ? { ...i, [field]: value } : i
    ));
  };

  const selectCommodityForSurvey = (tempId, commodityOrId) => {
    if (!commodityOrId) {
      setSurveyItems(surveyItems.map(i =>
        i.tempId === tempId ? {
          ...i,
          commodity_item_id: null,
          item_name: '',
          unit: 'kg',
          custom_unit: '',
        } : i
      ));
      return;
    }
    const commodity = typeof commodityOrId === 'object' ? commodityOrId : items.find(i => i.id === commodityOrId);
    if (commodity) {
      setSurveyItems(surveyItems.map(i =>
        i.tempId === tempId ? {
          ...i,
          commodity_item_id: commodity.id,
          item_name: commodity.nama,
          unit: commodity.satuan_default || 'kg',
          custom_unit: '',
        } : i
      ));
    }
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    if (!surveyForm.shop_name || !surveyForm.shop_name.trim()) {
      toast.error('Harap isi nama toko/pasar.');
      return;
    }
    if (surveyItems.length === 0) {
      toast.error('Tambahkan minimal 1 item harga.');
      return;
    }

    const invalidItems = surveyItems.filter(i => {
      const nameOk = i.item_name && i.item_name.trim().length > 0;
      const priceVal = parseFloat(i.reference_price);
      const priceOk = !isNaN(priceVal) && priceVal > 0;
      const qtyVal = parseFloat(i.qty);
      const qtyOk = !isNaN(qtyVal) && qtyVal > 0;
      return !nameOk || !priceOk || !qtyOk;
    });

    if (invalidItems.length > 0) {
      toast.error('Harap pastikan semua item memiliki nama barang, harga (> 0), dan Qty (> 0).');
      return;
    }

    const payload = {
      ...surveyForm,
      shop_name: surveyForm.shop_name.trim(),
      region_id: surveyForm.region_id.trim(),
      surveyor_name: surveyForm.surveyor_name ? surveyForm.surveyor_name.trim() : null,
      items: surveyItems.map(i => {
        const finalUnit = i.unit === 'custom' ? (i.custom_unit || 'kg').trim() : i.unit.trim();
        return {
          commodity_item_id: i.commodity_item_id || null,
          item_name: i.item_name.trim(),
          reference_price: parseFloat(i.reference_price),
          unit: finalUnit,
          qty: parseFloat(i.qty) || 1,
          supplier_name: i.supplier_name ? i.supplier_name.trim() : null,
          notes: i.notes ? i.notes.trim() : null,
        };
      })
    };

    try {
      const res = await submitSurvey(payload);
      if (res && res.failed === 0) {
        setSurveyItems([]);
        setSurveyForm(prev => ({
          ...prev,
          survey_session_id: `SURVEY-${new Date().getTime()}`,
          surveyor_name: profile?.full_name || '',
          shop_name: '',
        }));
      }
    } catch {
      // error handled by mutation onError
    }
  };

  const handleExportPrices = () => {
    if (allPrices.length === 0) {
      toast.error('Tidak ada data harga untuk diexport.');
      return;
    }

    const data = allPrices.map((p, idx) => ({
      'No': idx + 1,
      'Nama Barang': p.item_name,
      'Wilayah': p.region_id || '-',
      'Toko': p.shop_name || '-',
      'Harga': p.reference_price,
      'Satuan': p.unit,
      'Tanggal': p.price_date ? new Date(p.price_date).toLocaleDateString('id-ID') : '-',
      'Survey ID': p.survey_session_id || '-',
      'Catatan': p.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Harga");
    ws['!cols'] = [5, 25, 15, 20, 15, 10, 15, 25, 20].map(w => ({ wch: w }));
    XLSX.writeFile(wb, `Data_Harga_Komoditas_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data harga berhasil diunduh!');
  };

  const fetchSurveySessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await api.get('/commodities/surveys');
      setSurveySessions(data);
    } catch {
      toast.error('Gagal memuat data survey.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchSessionItems = async (sessionId) => {
    if (sessionItems[sessionId]) return;
    try {
      const { data } = await api.get(`/commodities/surveys/${sessionId}`);
      setSessionItems(prev => ({ ...prev, [sessionId]: data }));
    } catch {
      toast.error('Gagal memuat detail survey.');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Hapus seluruh data survey ini?')) return;
    try {
      await api.delete(`/commodities/surveys/${sessionId}`);
      toast.success('Survey berhasil dihapus.');
      setSurveySessions(prev => prev.filter(s => s.survey_session_id !== sessionId));
      setSessionItems(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    } catch {
      toast.error('Gagal menghapus survey.');
    }
  };

  const openEditPrice = (item) => {
    setEditingPriceId(item.id);
    setEditPriceForm({
      item_name: item.item_name,
      reference_price: item.reference_price,
      unit: item.unit,
      supplier_name: item.supplier_name || '',
    });
  };

  const handleSavePrice = async (sessionId) => {
    try {
      const payload = {};
      if (editPriceForm.item_name) payload.item_name = editPriceForm.item_name;
      if (editPriceForm.reference_price) payload.reference_price = parseFloat(editPriceForm.reference_price);
      if (editPriceForm.unit) payload.unit = editPriceForm.unit;
      payload.supplier_name = editPriceForm.supplier_name || null;
      const { data } = await api.put(`/commodities/prices/${editingPriceId}`, payload);
      setSessionItems(prev => ({
        ...prev,
        [sessionId]: (prev[sessionId] || []).map(i => i.id === editingPriceId ? data : i)
      }));
      setEditingPriceId(null);
      toast.success('Item berhasil diperbarui.');
      fetchSurveySessions();
    } catch {
      toast.error('Gagal memperbarui item.');
    }
  };

  const handleDeletePrice = async (sessionId, priceId) => {
    if (!confirm('Hapus item ini dari survey?')) return;
    try {
      await api.delete(`/commodities/prices/${priceId}`);
      setSessionItems(prev => ({
        ...prev,
        [sessionId]: (prev[sessionId] || []).filter(i => i.id !== priceId)
      }));
      toast.success('Item berhasil dihapus.');
      fetchSurveySessions();
    } catch {
      toast.error('Gagal menghapus item.');
    }
  };

  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">Harga Bahan Baku</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm lg:text-base mt-1">Pantau dan kelola data harga komoditas bahan baku SPPG dari waktu ke waktu.</p>
        </div>

        <div className="w-full lg:w-auto bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 shadow-inner">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap lg:flex-nowrap gap-1.5">
            <button onClick={() => setActiveTab('dashboard')}
              className={`px-3 lg:px-4 py-2.5 rounded-xl text-[11px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 ring-1 ring-slate-900/5 font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`}>
              <BarChart3 size={14} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Dashboard</span>
            </button>
            <button onClick={() => { setActiveTab('ntb-live'); fetchNtbLivePrices(); }}
              className={`px-3 lg:px-4 py-2.5 rounded-xl text-[11px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'ntb-live' ? 'bg-white text-emerald-600 shadow-md shadow-emerald-500/10 ring-1 ring-slate-900/5 font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`}>
              <Globe size={14} className={activeTab === 'ntb-live' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Harga NTB</span>
            </button>
            <button onClick={() => setActiveTab('survey')}
              className={`px-3 lg:px-4 py-2.5 rounded-xl text-[11px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'survey' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 ring-1 ring-slate-900/5 font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`}>
              <ShoppingCart size={14} className={activeTab === 'survey' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Input Survey</span>
            </button>
            <button onClick={() => { setActiveTab('data-survey'); fetchSurveySessions(); }}
              className={`px-3 lg:px-4 py-2.5 rounded-xl text-[11px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'data-survey' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 ring-1 ring-slate-900/5 font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`}>
              <Database size={14} className={activeTab === 'data-survey' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Data Survey</span>
            </button>
            <button onClick={() => setActiveTab('history')}
              className={`px-3 lg:px-4 py-2.5 rounded-xl text-[11px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 ring-1 ring-slate-900/5 font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`}>
              <History size={14} className={activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Riwayat</span>
            </button>
            <button onClick={() => setActiveTab('master')}
              className={`col-span-2 sm:col-span-1 px-3 lg:px-4 py-2.5 rounded-xl text-[11px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'master' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 ring-1 ring-slate-900/5 font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`}>
              <Package size={14} className={activeTab === 'master' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Master</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          {(() => {
            const totalSurvey = new Set(allPrices.filter(p => p.survey_session_id).map(p => p.survey_session_id)).size;
            const totalWilayah = new Set(allPrices.map(p => p.region_id).filter(Boolean)).size;
            const stats = [
              { label: 'Komoditas Dipantau', value: items.length, icon: Package, bg: 'bg-blue-50', text: 'text-blue-600' },
              { label: 'Data Harga Tercatat', value: allPrices.length, icon: BarChart3, bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { label: 'Total Survey', value: totalSurvey, icon: ShoppingCart, bg: 'bg-amber-50', text: 'text-amber-600' },
              { label: 'Wilayah', value: totalWilayah, icon: TrendingUp, bg: 'bg-purple-50', text: 'text-purple-600' },
            ];
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {stats.map(({ label, value, icon: Icon, bg, text }, idx) => (
                  <div key={idx} className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                        <h3 className={`text-2xl lg:text-3xl font-black mt-1 lg:mt-2 ${text}`}>{value}</h3>
                      </div>
                      <div className={`w-10 h-10 lg:w-11 lg:h-11 ${bg} rounded-xl lg:rounded-2xl flex items-center justify-center ${text}`}>
                        <Icon size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* 🔍 Cek Harga Terupdate & 3 Survey Terakhir Bahan Baku */}
          <div id="survey-inspector" className="bg-white p-6 lg:p-8 rounded-[2rem] border border-blue-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Cek Harga Terupdate & 3 Survey Terakhir
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Pilih atau cari bahan baku untuk mengecek harga terbaru, 3 survey terakhir, pasar/toko lokasi, dan petugas survey.
                  </p>
                </div>
              </div>
              
              {/* Searchable Commodity Selector */}
              <div className="w-full md:w-72 shrink-0">
                <SearchableCommoditySelect
                  items={items}
                  selectedId={items.find(i => i.nama.toLowerCase().trim() === (selectedInspectorItem || '').toLowerCase().trim())?.id || null}
                  onSelect={(comm) => {
                    if (comm) setSelectedInspectorItem(comm.nama);
                  }}
                  placeholder="🔍 Cari Bahan Baku..."
                />
              </div>
            </div>

            {/* Content for Selected Commodity */}
            {(() => {
              const itemName = selectedInspectorItem || items[0]?.nama || latestPrices[0]?.item_name || '';
              if (!itemName) {
                return (
                  <div className="py-8 text-center text-slate-400 text-xs font-bold">
                    Silakan pilih komoditas di atas untuk mengecek data survey terakhir.
                  </div>
                );
              }

              // Filter allPrices for this item_name
              const historyForItem = allPrices
                .filter(p => p.item_name.toLowerCase().trim() === itemName.toLowerCase().trim() || (items.find(i => i.nama.toLowerCase() === itemName.toLowerCase()) && p.commodity_item_id === items.find(i => i.nama.toLowerCase() === itemName.toLowerCase())?.id))
                .sort((a, b) => new Date(b.price_date || b.created_at) - new Date(a.price_date || a.created_at));

              const latest3 = historyForItem.slice(0, 3);
              const latestEntry = historyForItem[0];
              const commodityMeta = items.find(i => i.nama.toLowerCase() === itemName.toLowerCase());

              return (
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="p-5 lg:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-blue-900/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-200 text-[10px] font-black uppercase rounded-lg">
                          {commodityMeta?.kategori || 'Bahan Baku'}
                        </span>
                        <span className="text-xs text-blue-200 font-bold">Satuan Default: {commodityMeta?.satuan_default || latestEntry?.unit || 'kg'}</span>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-black mt-1 flex items-center gap-2">
                        <Package size={22} className="text-blue-400 shrink-0" />
                        {itemName}
                      </h3>
                    </div>
                    {latestEntry ? (
                      <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-xl backdrop-blur-sm self-start md:self-auto border border-white/10">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-blue-200">Harga Terupdate</p>
                          <p className="text-2xl font-black text-white">{formatRupiah(latestEntry.reference_price)} <span className="text-xs font-bold text-blue-200">/ {latestEntry.unit}</span></p>
                        </div>
                        <div className="border-l border-white/20 pl-4 text-xs font-medium text-blue-100">
                          <p className="font-bold flex items-center gap-1.5 truncate max-w-[180px]">📍 {latestEntry.shop_name || 'Pasar Sikur'}</p>
                          <p className="flex items-center gap-1.5 mt-0.5 font-bold text-sky-200 truncate max-w-[180px]"><User size={12} /> {latestEntry.surveyor_name || 'Petugas Survey'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-200 font-bold">Belum ada riwayat survey untuk komoditas ini.</p>
                    )}
                  </div>

                  {/* 3 Last Surveys Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <History size={14} className="text-blue-600" /> Data Lengkap 3 Survey Terakhir ({latest3.length} Survey)
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">Total Record Survey: {historyForItem.length}</span>
                    </div>
                    
                    {latest3.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-bold">
                        Belum ada data survey pasar tercatat untuk {itemName}. Silakan input survey pasar di tab "Input Survey".
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {latest3.map((survey, index) => {
                          const prevSurvey = historyForItem[index + 1];
                          let priceDiff = 0;
                          let priceDiffPct = 0;
                          if (prevSurvey && prevSurvey.reference_price > 0) {
                            priceDiff = survey.reference_price - prevSurvey.reference_price;
                            priceDiffPct = (priceDiff / prevSurvey.reference_price) * 100;
                          }

                          const rankBadges = [
                            { label: 'Survei #1 (Terbaru)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                            { label: 'Survei #2 (Sebelumnya)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                            { label: 'Survei #3 (Lama)', color: 'bg-slate-100 text-slate-700 border-slate-300' },
                          ];

                          return (
                            <div key={survey.id || index} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border ${rankBadges[index]?.color}`}>
                                    {rankBadges[index]?.label}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                                    📅 {survey.price_date ? new Date(survey.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                  </span>
                                </div>

                                <div className="pt-2">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Harga Acuan Hasil Survey</p>
                                  <p className="text-xl font-black text-slate-800 mt-0.5">
                                    {formatRupiah(survey.reference_price)} <span className="text-xs font-bold text-slate-500">/ {survey.unit}</span>
                                  </p>
                                  
                                  {/* Price Change vs Previous */}
                                  {prevSurvey ? (
                                    <div className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-md ${
                                      priceDiff > 0 ? 'bg-rose-100 text-rose-800' : priceDiff < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {priceDiff > 0 ? `📈 Naik ${formatRupiah(priceDiff)} (+${priceDiffPct.toFixed(1)}%)` : priceDiff < 0 ? `📉 Turun ${formatRupiah(Math.abs(priceDiff))} (${priceDiffPct.toFixed(1)}%)` : '⚖️ Stabil (0%)'}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 font-medium mt-1">Titik dasar pencatatan</div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-200/60 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="text-slate-400 font-bold text-[10px] uppercase">Toko / Pasar:</span>
                                  <span className="font-bold text-slate-800 truncate max-w-[150px]">📍 {survey.shop_name || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="text-slate-400 font-bold text-[10px] uppercase">Petugas Survey:</span>
                                  <span className="font-bold text-blue-700 flex items-center gap-1 truncate max-w-[150px]">
                                    <User size={12} /> {survey.surveyor_name || 'Petugas Survey'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                  <span className="text-slate-400 font-bold text-[10px] uppercase">Wilayah:</span>
                                  <span className="font-bold text-slate-700">{survey.region_id || 'Sikur'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Category Summary */}
          {items.length > 0 && (
            <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Package size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800">Kategori Komoditas</h2>
                  <p className="text-slate-400 font-medium text-xs">Distribusi komoditas berdasarkan kategori.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const catCount = {};
                  items.forEach(i => { const k = i.kategori || 'Umum'; catCount[k] = (catCount[k] || 0) + 1; });
                  const colors = ['bg-blue-50 text-blue-700 border-blue-200', 'bg-emerald-50 text-emerald-700 border-emerald-200', 'bg-amber-50 text-amber-700 border-amber-200', 'bg-rose-50 text-rose-700 border-rose-200', 'bg-purple-50 text-purple-700 border-purple-200', 'bg-cyan-50 text-cyan-700 border-cyan-200', 'bg-orange-50 text-orange-700 border-orange-200', 'bg-teal-50 text-teal-700 border-teal-200', 'bg-slate-50 text-slate-700 border-slate-200'];
                  return Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([cat, count], idx) => (
                    <span key={cat} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider ${colors[idx % colors.length]}`}>
                      {cat}
                      <span className="px-1.5 py-0.5 rounded-md bg-white/60 text-inherit">{count}</span>
                    </span>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Latest Survey Info */}
          {(() => {
            if (allPrices.length === 0) return null;
            const sorted = [...allPrices].sort((a, b) => new Date(b.created_at || b.price_date) - new Date(a.created_at || a.price_date));
            const latest = sorted[0];
            if (!latest) return null;
            const sessionItems = allPrices.filter(p => p.survey_session_id === latest.survey_session_id);
            return (
              <div className="bg-white p-5 lg:p-8 rounded-2xl lg:rounded-[2rem] border border-blue-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800">Survey Terakhir</h2>
                    <p className="text-slate-400 font-medium text-xs">Informasi survey pasar terbaru.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                  <div className="p-3 lg:p-4 bg-sky-50/50 rounded-xl lg:rounded-2xl border border-sky-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Toko / Pasar</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 lg:mt-1 truncate">{latest.shop_name || '-'}</p>
                  </div>
                  <div className="p-3 lg:p-4 bg-sky-50/50 rounded-xl lg:rounded-2xl border border-sky-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tanggal</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 lg:mt-1">
                      {latest.price_date ? new Date(latest.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div className="p-3 lg:p-4 bg-sky-50/50 rounded-xl lg:rounded-2xl border border-sky-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Item Tercatat</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 lg:mt-1">{sessionItems.length} item</p>
                  </div>
                  <div className="p-3 lg:p-4 bg-sky-50/50 rounded-xl lg:rounded-2xl border border-sky-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Wilayah</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 lg:mt-1">{latest.region_id || '-'}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Harga Terkini */}
          <div className="bg-white rounded-2xl lg:rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden">
            <div className="px-5 lg:px-8 py-4 lg:py-5 border-b border-blue-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <BarChart3 size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-slate-800 truncate">Harga Terkini</h2>
                  <p className="text-slate-400 font-medium text-xs truncate">Harga terbaru per komoditas.</p>
                </div>
              </div>
              <button onClick={handleExportPrices}
                className="shrink-0 flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] lg:text-xs uppercase tracking-wider shadow-lg shadow-emerald-100 transition-all">
                <Download size={13} /> Export
              </button>
            </div>
            {loadingPrices ? (
              <div className="py-12"><Loader2 className="animate-spin mx-auto text-blue-600" size={24} /></div>
            ) : latestPrices.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm">Belum ada data harga.</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-blue-50 sticky top-0">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Komoditas</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Harga Terkini</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Satuan</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tanggal</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Toko / Pasar</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Wilayah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {latestPrices.map((p) => (
                        <tr key={p.item_name} 
                          onClick={() => {
                            setSelectedInspectorItem(p.item_name);
                            document.getElementById('survey-inspector')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selectedInspectorItem.toLowerCase() === p.item_name.toLowerCase() ? 'bg-blue-50/60 font-bold' : ''}`}>
                          <td className="px-6 py-4"><p className="font-bold text-slate-800 text-sm flex items-center gap-1.5"><Package size={14} className="text-blue-600 shrink-0" />{p.item_name}</p></td>
                          <td className="px-6 py-4"><span className="font-black text-blue-600 text-base bg-blue-50/50 px-3 py-1.5 rounded-xl inline-block">{formatRupiah(p.reference_price)}</span></td>
                          <td className="px-6 py-4 text-center"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">{p.unit}</span></td>
                          <td className="px-6 py-4 text-center font-bold text-slate-500 text-xs">{p.price_date ? new Date(p.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                          <td className="px-6 py-4 font-medium text-slate-600 text-sm">{p.shop_name || '-'}</td>
                          <td className="px-6 py-4 font-bold text-slate-500 text-xs">{p.region_id || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {latestPrices.map((p) => (
                    <div key={p.item_name} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-800 text-sm">{p.item_name}</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg uppercase">{p.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-blue-600">{formatRupiah(p.reference_price)}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{p.price_date ? new Date(p.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">📍 {p.shop_name || '-'}</span>
                        <span>•</span>
                        <span>{p.region_id || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ntb-live' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-6 lg:p-8 shadow-xl shadow-emerald-900/10 border border-emerald-600/30">
            <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0 border border-white/20">
                  <Globe size={28} className="text-emerald-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/30">
                      <Radio size={10} className="animate-pulse text-emerald-300" /> Live Synchronized
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/15 text-white px-3 py-1 rounded-full border border-white/20">
                      {ntbLivePrices.length} Komoditas Responded
                    </span>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black tracking-tight mt-2">
                    Harga Pangan Acuan <span className="text-emerald-300">Disperindag NTB & SP2KP</span>
                  </h2>
                  <p className="text-xs text-emerald-100/80 font-medium mt-1 max-w-xl">
                    Pantauan harga rata-rata bahan pokok resmi dari pasar acuan se-NTB sebagai acuan utama standar perencanaan anggaran katering dan audit alokasi SPPG.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={fetchNtbLivePrices}
                  disabled={loadingLiveNtb}
                  className="px-4 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 active:scale-95 disabled:opacity-60 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-400/20 cursor-pointer"
                >
                  <RefreshCw size={14} className={loadingLiveNtb ? 'animate-spin' : ''} />
                  <span>{loadingLiveNtb ? 'Memuat...' : 'Refresh Live'}</span>
                </button>
                <a
                  href="https://disperindag.ntbprov.go.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/15 backdrop-blur-sm"
                >
                  <span>Portal Disperindag</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Stat Strip */}
            <div className="relative mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 text-emerald-300 flex items-center justify-center shrink-0"><Package size={18} /></div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-emerald-200/80 font-bold">Total Komoditas</p>
                  <p className="text-xl font-black text-white">{ntbLivePrices.length}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-400/30 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/30 text-rose-200 flex items-center justify-center shrink-0"><TrendingUp size={18} /></div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-rose-200/80 font-bold">Kenaikan Harga</p>
                  <p className="text-xl font-black text-rose-200">{ntbLivePrices.filter(i => i.status_tren === 'NAIK').length}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-200 flex items-center justify-center shrink-0"><TrendingDown size={18} /></div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-emerald-200/80 font-bold">Penurunan Harga</p>
                  <p className="text-xl font-black text-emerald-200">{ntbLivePrices.filter(i => i.status_tren === 'TURUN').length}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 text-slate-200 flex items-center justify-center shrink-0"><Minus size={18} /></div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-200/80 font-bold">Harga Stabil</p>
                  <p className="text-xl font-black text-white">{ntbLivePrices.filter(i => i.status_tren === 'STABIL' || !i.status_tren).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Light Filter & View Toolbar */}
          <div className="bg-white rounded-[2rem] border border-blue-100 p-4 lg:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm sticky top-20 z-20">
            <div className="flex items-center gap-3 flex-1 lg:max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="🔍 Cari komoditas acuan NTB..."
                  value={ntbSearchQuery}
                  onChange={(e) => setNtbSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white transition-all"
                />
                {ntbSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setNtbSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setNtbViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${ntbViewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                  title="Tampilan Grid Kartu"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setNtbViewMode('table')}
                  className={`p-2 rounded-lg transition-all ${ntbViewMode === 'table' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                  title="Tampilan Tabel"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
              {ntbCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedNtbCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    selectedNtbCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          {(() => {
            const filteredList = ntbLivePrices.filter(item => {
              const matchCategory = selectedNtbCategory === 'SEMUA' || item.kategori === selectedNtbCategory;
              const matchSearch = !ntbSearchQuery || item.komoditas.toLowerCase().includes(ntbSearchQuery.toLowerCase());
              return matchCategory && matchSearch;
            });

            if (loadingLiveNtb) {
              return (
                <div className="p-12 text-center bg-white rounded-[2rem] border border-blue-100 shadow-sm">
                  <Loader2 size={32} className="mx-auto text-emerald-600 animate-spin" />
                  <p className="mt-3 text-xs font-bold text-slate-500">Menghubungkan ke API Disperindag & SP2KP NTB...</p>
                </div>
              );
            }

            if (filteredList.length === 0) {
              return (
                <div className="p-12 text-center bg-white rounded-[2rem] border border-blue-100 shadow-sm">
                  <CandlestickChart size={32} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-500">Komoditas tidak ditemukan.</p>
                  <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau kategori filter.</p>
                </div>
              );
            }

            // Render GRID View
            if (ntbViewMode === 'grid') {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredList.map((item, idx) => {
                    const isNaik = item.status_tren === 'NAIK';
                    const isTurun = item.status_tren === 'TURUN';
                    const changeRp = getChangeRp(item);
                    const isSelected = selectedNtbItem?.komoditas === item.komoditas;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectNtbItem(item)}
                        className={`text-left p-4 lg:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative group ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                            : 'bg-white border-slate-200/80 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-lg">
                              {item.kategori}
                            </span>
                            <h4 className="font-black text-slate-800 text-sm mt-2 group-hover:text-emerald-700 transition-colors leading-tight truncate">
                              {item.komoditas}
                            </h4>
                          </div>

                          <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shrink-0 ${
                            isNaik ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                            isTurun ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {isNaik ? <ArrowUpRight size={12} /> : isTurun ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                            <span>{item.perubahan !== 0 ? `${item.perubahan > 0 ? '+' : ''}${item.perubahan}%` : 'STABIL'}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Harga Rata-Rata NTB</p>
                          <p className="text-xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
                            Rp {item.harga_ntb.toLocaleString('id-ID')}
                            <span className="text-xs font-bold text-slate-400">/{item.satuan}</span>
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-slate-100">
                            <span className={`text-[10px] font-black flex items-center gap-1 ${isNaik ? 'text-rose-600' : isTurun ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {isNaik ? <ArrowUpRight size={11} /> : isTurun ? <ArrowDownRight size={11} /> : <Minus size={11} />}
                              {isNaik ? '+' : ''}Rp {Math.abs(Math.round(changeRp)).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 truncate max-w-[110px]">📍 {item.pasar_acuan}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            }

            // Render TABLE View
            return (
              <div className="bg-white rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[620px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-blue-50 sticky top-0 z-10">
                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Komoditas</th>
                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Kategori</th>
                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Harga NTB</th>
                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Satuan</th>
                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Tren</th>
                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Selisih (Rp)</th>
                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Pasar Acuan</th>
                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredList.map((item, idx) => {
                        const isNaik = item.status_tren === 'NAIK';
                        const isTurun = item.status_tren === 'TURUN';
                        const changeRp = getChangeRp(item);
                        const isSelected = selectedNtbItem?.komoditas === item.komoditas;

                        return (
                          <tr
                            key={idx}
                            onClick={() => selectNtbItem(item)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/70 font-bold' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800 text-sm">{item.komoditas}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-200/60">
                                {item.kategori}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-black text-slate-900 text-sm">
                              Rp {item.harga_ntb.toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-4 text-center font-bold text-slate-500 text-xs">
                              {item.satuan}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg uppercase ${
                                isNaik ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                isTurun ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                {isNaik ? <ArrowUpRight size={12} /> : isTurun ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                                {item.perubahan !== 0 ? `${item.perubahan > 0 ? '+' : ''}${item.perubahan}%` : 'STABIL'}
                              </span>
                            </td>
                            <td className={`px-5 py-4 text-right font-black text-xs ${
                              isNaik ? 'text-rose-600' : isTurun ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {isNaik ? '+' : ''}Rp {Math.abs(Math.round(changeRp)).toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-4 text-xs font-bold text-slate-500">
                              📍 {item.pasar_acuan}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); selectNtbItem(item); }}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Modal Detail Harga Pangan */}
          {selectedNtbItem && createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
              onClick={() => setSelectedNtbItem(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl flex flex-col my-auto"
              >
                <div className="bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-emerald-200">
                  {/* Header */}
                  <div className="p-6 lg:p-7 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-start justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                        <CandlestickChart size={24} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-1 rounded-full">{selectedNtbItem.kategori}</span>
                        <h3 className="text-xl lg:text-2xl font-black tracking-tight mt-1.5 truncate">{selectedNtbItem.komoditas}</h3>
                        <p className="text-emerald-100 text-[11px] font-semibold mt-0.5">Pasar acuan: {selectedNtbItem.pasar_acuan} · Disperindag NTB & SP2KP</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedNtbItem(null)}
                      className="p-3 bg-white/10 text-white hover:bg-white/25 rounded-2xl transition-all shrink-0"
                      aria-label="Tutup modal"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-7 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Harga Live NTB</p>
                        <p className="text-2xl font-black text-emerald-900 mt-1">
                          Rp {selectedNtbItem.harga_ntb.toLocaleString('id-ID')}
                          <span className="text-xs font-bold text-emerald-600">/{selectedNtbItem.satuan}</span>
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Perubahan (%)</p>
                        <p className={`text-2xl font-black mt-1 flex items-center gap-1 ${selectedNtbItem.perubahan > 0 ? 'text-rose-600' : selectedNtbItem.perubahan < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {selectedNtbItem.perubahan > 0 ? <ArrowUpRight size={20} /> : selectedNtbItem.perubahan < 0 ? <ArrowDownRight size={20} /> : <Minus size={20} />}
                          {selectedNtbItem.perubahan !== 0 ? `${selectedNtbItem.perubahan > 0 ? '+' : ''}${selectedNtbItem.perubahan}%` : 'STABIL'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Perubahan Nominal (Rp)</p>
                        <p className={`text-2xl font-black mt-1 flex items-center gap-1 ${getChangeRp(selectedNtbItem) > 0 ? 'text-rose-600' : getChangeRp(selectedNtbItem) < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {getChangeRp(selectedNtbItem) > 0 ? <ArrowUpRight size={20} /> : getChangeRp(selectedNtbItem) < 0 ? <ArrowDownRight size={20} /> : <Minus size={20} />}
                          {getChangeRp(selectedNtbItem) !== 0 ? `Rp ${Math.abs(Math.round(getChangeRp(selectedNtbItem))).toLocaleString('id-ID')}` : 'STABIL'}
                        </p>
                      </div>
                    </div>

                    {/* Riwayat Harga Survey Lokal */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <History size={15} className="text-emerald-600" /> Riwayat Survey Pasar Lokal (Lombok Timur / Sikur)
                        </h3>
                      </div>
                      {loadingNtbHistory ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl">
                          <Loader2 size={24} className="mx-auto text-emerald-600 animate-spin" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {priceHistory.length > 0 ? (
                            priceHistory.map((h, idx) => (
                              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(h.created_at || h.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <p className="text-base font-black text-slate-800 mt-1">
                                  Rp {(h.reference_price ?? 0).toLocaleString('id-ID')}
                                  <span className="text-xs font-semibold text-slate-400">/{h.unit ?? selectedNtbItem.satuan}</span>
                                </p>
                                {h.shop_name && <p className="text-xs text-slate-500 font-bold mt-1">📍 {h.shop_name}</p>}
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 col-span-full">
                              <p className="text-xs font-bold text-slate-400">Belum ada catatan survey lokal untuk komoditas ini.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-5 lg:p-6 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-3 shrink-0 rounded-b-[2.5rem]">
                    <button
                      type="button"
                      onClick={() => setSelectedNtbItem(null)}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>,
            document.body
          )}

          {/* Source Note */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Globe size={18} className="text-emerald-700 shrink-0" />
              <p className="text-slate-700 font-medium leading-relaxed">
                <strong className="text-emerald-900 font-bold">Sumber Resmi SP2KP & Disperindag NTB:</strong> Data harga kebutuhan pokok diperbarui secara real-time sebagai acuan standar perencanaan anggaran katering dan audit alokasi SPPG di NTB.
              </p>
            </div>
            {ntbLastUpdate && (
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                Update terakhir: {ntbLastUpdate.toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>
        </div>
      )}
      {activeTab === 'survey' && (
        <div className="space-y-6">
          {/* Header Card — Data Survey */}
          <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-blue-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800">Data Survey</h2>
                  <p className="text-slate-400 text-xs font-medium">Input informasi lokasi survey pasar manual atau via Excel.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExcelModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all shrink-0"
              >
                <FileSpreadsheet size={16} />
                Import Excel (.xlsx)
              </button>
            </div>

            <form id="survey-form" onSubmit={handleSubmitSurvey}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nama Toko / Pasar <span className="text-red-400">*</span></label>
                  <input type="text" required placeholder="Contoh: Toko Barokah / Pasar Sikur"
                    value={surveyForm.shop_name}
                    onChange={(e) => setSurveyForm(prev => ({ ...prev, shop_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Wilayah</label>
                  <select value={surveyForm.region_id}
                    onChange={(e) => setSurveyForm(prev => ({ ...prev, region_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm appearance-none">
                    {regionList.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tanggal <span className="text-red-400">*</span></label>
                  <input type="date" required value={surveyForm.survey_date}
                    onChange={(e) => setSurveyForm(prev => ({ ...prev, survey_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Surveyor</label>
                  <input type="text" placeholder="Nama petugas"
                    value={surveyForm.surveyor_name}
                    onChange={(e) => setSurveyForm(prev => ({ ...prev, surveyor_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm" />
                </div>
              </div>
            </form>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden">
            <div className="p-6 lg:p-8 border-b border-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Daftar Harga</h2>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg">
                  {surveyItems.length} item
                </span>
              </div>
              <button onClick={addSurveyItemRow}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-100 transition-all">
                <Plus size={14} /> Tambah Item
              </button>
            </div>

            <div className="p-5 lg:p-8 space-y-3">
              {surveyItems.length === 0 ? (
                <div className="text-center py-12 lg:py-16">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={28} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Belum ada item.</p>
                  <p className="text-slate-300 text-xs mt-1">Klik "Tambah Item" untuk mulai mencatat harga bahan baku.</p>
                </div>
              ) : (
                surveyItems.map((item, idx) => {
                  const harga = parseFloat(item.reference_price) || 0;
                  const qty = parseFloat(item.qty) || 0;
                  const subtotal = harga * qty;
                  const isCustom = !item.commodity_item_id;
                  return (
                    <div key={item.tempId}
                      className="border border-slate-200 rounded-xl lg:rounded-2xl p-4 lg:p-5 hover:border-blue-200 transition-all">
                      {/* Row 1: Commodity + Supplier */}
                      <div className="flex items-start gap-2 lg:gap-3 mb-3">
                        <span className="w-5 h-5 lg:w-6 lg:h-6 bg-blue-600 text-white text-[9px] lg:text-[10px] font-black rounded-lg flex items-center justify-center shrink-0 mt-1">
                          {idx + 1}
                        </span>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
                          <SearchableCommoditySelect
                            items={items}
                            selectedId={item.commodity_item_id}
                            onSelect={(commodity) => selectCommodityForSurvey(item.tempId, commodity)}
                          />
                          {isCustom ? (
                            <input type="text" required placeholder="Nama barang (custom)"
                              value={item.item_name}
                              onChange={(e) => updateSurveyItem(item.tempId, 'item_name', e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                          ) : (
                            <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 truncate">
                              {item.item_name || '-'}
                            </div>
                          )}
                          <input type="text" placeholder="Supplier (opsional)"
                            value={item.supplier_name}
                            onChange={(e) => updateSurveyItem(item.tempId, 'supplier_name', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                        </div>
                        <button type="button" onClick={() => removeSurveyItem(item.tempId)}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all mt-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {/* Row 2: Price, Unit, Qty, Subtotal */}
                      <div className="grid grid-cols-4 gap-2 lg:gap-3">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Harga (Rp)</label>
                          <input type="number" required placeholder="14000"
                            value={item.reference_price}
                            onChange={(e) => updateSurveyItem(item.tempId, 'reference_price', e.target.value)}
                            className="w-full px-2.5 lg:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Satuan</label>
                          <select value={item.unit}
                            onChange={(e) => updateSurveyItem(item.tempId, 'unit', e.target.value)}
                            className="w-full px-2.5 lg:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none appearance-none">
                            {UNIT_CATEGORIES.map(cat => (
                              <optgroup key={cat.label} label={cat.label}>
                                {cat.units.map(u => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </optgroup>
                            ))}
                            <option value="custom">➕ Lainnya (Ketik Custom)...</option>
                          </select>
                          {item.unit === 'custom' && (
                            <input type="text" required placeholder="Ketik satuan..."
                              value={item.custom_unit || ''}
                              onChange={(e) => updateSurveyItem(item.tempId, 'custom_unit', e.target.value)}
                              className="w-full mt-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Qty</label>
                          <input type="number" step="0.01" min="0.01" value={item.qty}
                            onChange={(e) => updateSurveyItem(item.tempId, 'qty', e.target.value)}
                            className="w-full px-2.5 lg:px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Subtotal</label>
                          <div className="h-[38px] flex items-center px-2.5 lg:px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black text-emerald-700">
                            {subtotal > 0 ? formatRupiah(subtotal) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: Summary + Save */}
            {surveyItems.length > 0 && (
              <div className="p-4 lg:p-8 border-t border-blue-50 bg-slate-50/50 flex items-center justify-between gap-3">
                <div className="text-[11px] lg:text-xs text-slate-500 font-medium">
                  <span className="font-black text-slate-800">{surveyItems.length} item</span>
                  <span className="mx-1.5">·</span>
                  Nilai <span className="font-black text-emerald-700">{formatRupiah(surveyItems.reduce((sum, i) => sum + ((parseFloat(i.reference_price) || 0) * (parseFloat(i.qty) || 0)), 0))}</span>
                </div>
                <button type="submit" form="survey-form" disabled={isSubmitting}
                  className="shrink-0 px-5 lg:px-6 py-2.5 lg:py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 uppercase tracking-widest text-[10px] lg:text-xs disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={13} />}
                  Simpan ({surveyItems.filter(i => i.item_name && i.reference_price).length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'data-survey' && (
        <div className="space-y-6">
          <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Database size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800">Data Survey</h2>
                <p className="text-slate-400 text-xs font-medium">Kelola semua data survey pasar yang telah diinput.</p>
              </div>
            </div>
            {loadingSessions ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-blue-600" size={28} />
              </div>
            ) : surveySessions.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Database size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="font-bold text-sm">Belum ada data survey.</p>
                <p className="text-xs mt-1">Lakukan input survey pasar terlebih dahulu.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {surveySessions.map((session) => {
                  const isExpanded = expandedSessionId === session.survey_session_id;
                  const items = sessionItems[session.survey_session_id] || [];
                  return (
                    <div key={session.survey_session_id}
                      className="border border-slate-200 rounded-2xl overflow-hidden transition-all hover:border-blue-200">
                      {/* Session Header */}
                      <div className="p-5 bg-white flex items-center justify-between gap-4 cursor-pointer"
                        onClick={() => {
                          if (isExpanded) { setExpandedSessionId(null); }
                          else { setExpandedSessionId(session.survey_session_id); fetchSessionItems(session.survey_session_id); }
                        }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-800 text-sm truncate">{session.shop_name || 'Tanpa Nama'}</h3>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md uppercase">{session.region_id || '-'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                            <span>{session.survey_date ? new Date(session.survey_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{session.item_count} item</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className="font-black text-emerald-600">{formatRupiah(session.total_value)}</span>
                            {session.surveyor_name && (
                              <>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="flex items-center gap-1">
                                  <User size={10} className="text-slate-400" />
                                  {session.surveyor_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.survey_session_id); }}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={14} />
                          </button>
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Items */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/30">
                          {items.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-400 font-medium">
                              <Loader2 className="animate-spin mx-auto mb-2" size={18} />
                              Memuat data...
                            </div>
                          ) : (
                            <div className="p-4 space-y-2">
                              {items.map((item) => (
                                <div key={item.id}
                                  className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-100 transition-all">
                                  {editingPriceId === item.id ? (
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nama Barang</label>
                                          <input type="text" value={editPriceForm.item_name}
                                            onChange={(e) => setEditPriceForm(p => ({ ...p, item_name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Harga (Rp)</label>
                                          <input type="number" value={editPriceForm.reference_price}
                                            onChange={(e) => setEditPriceForm(p => ({ ...p, reference_price: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Satuan</label>
                                          <select value={editPriceForm.unit}
                                            onChange={(e) => setEditPriceForm(p => ({ ...p, unit: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none">
                                            {UNIT_CATEGORIES.map(cat => (
                                              <optgroup key={cat.label} label={cat.label}>
                                                {cat.units.map(u => (
                                                  <option key={u} value={u}>{u}</option>
                                                ))}
                                              </optgroup>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Supplier</label>
                                          <input type="text" value={editPriceForm.supplier_name}
                                            onChange={(e) => setEditPriceForm(p => ({ ...p, supplier_name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2 pt-1">
                                        <button onClick={() => setEditingPriceId(null)}
                                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all">
                                          Batal
                                        </button>
                                        <button onClick={() => handleSavePrice(session.survey_session_id)}
                                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1">
                                          <Save size={12} /> Simpan
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{item.item_name}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                                          <span className="font-black text-blue-600">{formatRupiah(item.reference_price)}</span>
                                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                          <span>/ {item.unit}</span>
                                          {item.supplier_name && (
                                            <>
                                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                              <span>{item.supplier_name}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => openEditPrice(item)}
                                          className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                          <Edit2 size={13} />
                                        </button>
                                        <button onClick={() => handleDeletePrice(session.survey_session_id, item.id)}
                                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-5 lg:space-y-6">
          {/* Filter Card */}
          <div className="bg-white p-5 lg:p-8 rounded-2xl lg:rounded-[2rem] border border-blue-100 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-800 truncate">Riwayat Harga</h2>
                  <p className="text-slate-400 text-xs font-medium truncate">Pantau pergerakan harga bahan baku.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
                  {(() => {
                    const today = new Date();
                    const periods = [
                      { label: '7 Hari', days: 7 },
                      { label: '30 Hari', days: 30 },
                      { label: '90 Hari', days: 90 },
                      { label: 'Semua', days: 0 },
                    ];
                    return periods.map(({ label, days }) => {
                      const expectedFrom = days === 0 ? '' : new Date(today.getTime() - days * 86400000).toISOString().split('T')[0];
                      const isActive = days === 0 ? (!dateFrom && !dateTo) : (dateFrom === expectedFrom && !dateTo);
                      return (
                        <button key={label}
                          onClick={() => {
                            if (days === 0) { setDateFrom(''); setDateTo(''); }
                            else { const d = new Date(); d.setDate(d.getDate() - days); setDateFrom(d.toISOString().split('T')[0]); setDateTo(''); }
                          }}
                          className={`shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {label}
                        </button>
                      );
                    });
                  })()}
                </div>
                {selectedChartItem && priceHistory.length > 0 && (
                  <button onClick={() => {
                    const csv = [
                      ['Tanggal','Toko','Wilayah','Satuan','Harga','Supplier'],
                      ...priceHistory.map(h => [h.price_date||'',h.shop_name||'',h.region_id||'',h.unit||'',h.reference_price,h.supplier_name||''])
                    ].map(r => r.join(',')).join('\n');
                    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${selectedChartItem.replace(/\s+/g,'_')}_riwayat.csv`; a.click();
                    URL.revokeObjectURL(a.href);
                    toast.success('CSV berhasil diunduh!');
                  }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all">
                    <Download size={12} /> CSV
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input type="text" placeholder="Cari komoditas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-xs font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-auto sm:min-w-[300px]">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Dari Tanggal</label>
                  <input type="date" value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sampai Tanggal</label>
                  <input type="date" value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Commodity Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {getFilteredItems().map((commodity) => {
              const isActive = selectedChartItem === commodity.nama;
              return (
                <button key={commodity.id}
                  onClick={() => setSelectedChartItem(commodity.nama)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all ${isActive ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
                  <span>{commodity.nama}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>{commodity.kategori || 'Umum'}</span>
                </button>
              );
            })}
            {getFilteredItems().length === 0 && (
              <p className="text-xs text-slate-400 font-medium py-3">Komoditas tidak ditemukan</p>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {!selectedChartItem ? (
              <div className="bg-white p-12 rounded-[2rem] border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center text-slate-400">
                <BarChart3 size={48} className="text-slate-200 mb-4" />
                <p className="font-bold text-sm">Pilih Komoditas</p>
                <p className="text-xs max-w-sm mt-1">Silakan pilih komoditas dari chip di atas untuk melihat grafik dan riwayat harga.</p>
              </div>
            ) : priceHistory.length === 0 ? (
              <div className="bg-white p-12 rounded-[2rem] border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center text-slate-400">
                <TrendingUp size={48} className="text-slate-200 mb-4" />
                <p className="font-bold text-sm">Tidak Ada Histori</p>
                <p className="text-xs max-w-sm mt-1">Belum ada data harga untuk "{selectedChartItem}" pada periode ini. Lakukan survey pasar terlebih dahulu atau ubah filter tanggal.</p>
              </div>
            ) : (
              <>
                {/* Stat Cards */}
                {(() => {
                  const prices = priceHistory.map(h => h.reference_price);
                  const max = Math.max(...prices);
                  const min = Math.min(...prices);
                  const avg = Math.round(prices.reduce((s, v) => s + v, 0) / prices.length);
                  const first = prices[0];
                  const last = prices[prices.length - 1];
                  const change = last - first;
                  const changePct = first > 0 ? (change / first) * 100 : 0;
                  const isUp = change >= 0;
                  const stats = [
                    { label: 'Tertinggi', value: max, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                    { label: 'Terendah', value: min, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                    { label: 'Rata-rata', value: avg, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                    { label: isUp ? 'Naik' : 'Turun', value: `${isUp ? '+' : ''}${changePct.toFixed(1)}%`, color: isUp ? 'text-rose-600' : 'text-emerald-600', bg: isUp ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100' },
                  ];
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                      {stats.map((s, idx) => (
                        <div key={idx} className={`${s.bg} border rounded-xl lg:rounded-2xl p-4 lg:p-5`}>
                          <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-wider mb-0.5 lg:mb-1">{s.label}</p>
                          <p className={`text-base lg:text-lg font-black ${s.color}`}>{idx < 3 ? formatRupiah(s.value) : s.value}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Chart */}
                <div className="bg-white p-5 lg:p-8 rounded-2xl lg:rounded-[2rem] border border-blue-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4 lg:mb-6 gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm lg:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 truncate">
                        Tren: <span className="text-blue-600 truncate">{selectedChartItem}</span>
                      </h2>
                      <p className="text-slate-400 font-medium text-[10px] lg:text-xs mt-0.5">Pergerakan harga berdasarkan histori survey.</p>
                    </div>
                    <span className="shrink-0 px-2.5 lg:px-3 py-1 lg:py-1.5 bg-blue-50 text-blue-600 text-[9px] lg:text-[10px] font-black rounded-lg">{priceHistory.length} data point</span>
                  </div>

                  <div className="relative w-full aspect-[16/9] lg:aspect-[16/7] overflow-hidden border border-slate-50 rounded-xl lg:rounded-2xl p-3 lg:p-4 bg-slate-50/20">
                    <svg viewBox="0 0 600 350" className="w-full h-full overflow-visible select-none" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="chart-area-grad-commodity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>
                      {getGridLines().map((line, idx) => (
                        <g key={idx}>
                          <line x1="60" y1={line.y} x2="560" y2={line.y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                          <text x="50" y={line.y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-bold font-mono">{formatRupiahShort(line.value)}</text>
                        </g>
                      ))}
                      <line x1="60" y1="300" x2="560" y2="300" stroke="#cbd5e1" strokeWidth="1.5" />
                      {priceHistory.map((h, idx) => {
                        const c = getChartCoords(idx, h.reference_price);
                        return (
                          <g key={h.id}>
                            <line x1={c.x} y1="300" x2={c.x} y2="304" stroke="#cbd5e1" strokeWidth="1.5" />
                            <text x={c.x} y="320" textAnchor="middle" className="fill-slate-400 text-[9px] font-black tracking-tight">
                              {h.price_date ? new Date(h.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                            </text>
                          </g>
                        );
                      })}
                      {getAreaPath() && <path d={getAreaPath()} fill="url(#chart-area-grad-commodity)" />}
                      {getLinePath() && <path d={getLinePath()} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
                      {priceHistory.map((h, idx) => {
                        const c = getChartCoords(idx, h.reference_price);
                        const isHover = hoveredPoint?.id === h.id;
                        return (
                          <circle key={h.id}
                            cx={c.x} cy={c.y}
                            r={isHover ? 7 : 5.5}
                            fill={isHover ? '#2563eb' : '#ffffff'}
                            stroke="#2563eb" strokeWidth="3"
                            className="transition-all duration-150 cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ ...h, x: c.x, y: c.y })}
                            onMouseLeave={() => setHoveredPoint(null)} />
                        );
                      })}
                    </svg>
                    {hoveredPoint && (
                      <div className="absolute bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1 z-10 pointer-events-none transition-all duration-100"
                        style={{ left: `${(hoveredPoint.x / 600) * 100}%`, top: `${(hoveredPoint.y / 350) * 100}%`, transform: 'translate(-50%, -120%)' }}>
                        <p className="font-black text-[9px] text-blue-400 uppercase tracking-widest">{hoveredPoint.shop_name || 'Toko'}</p>
                        <p className="font-black text-sm text-slate-100">{formatRupiah(hoveredPoint.reference_price)} / {hoveredPoint.unit}</p>
                        <p className="text-slate-400 text-[9px] font-bold">{hoveredPoint.price_date ? new Date(hoveredPoint.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                        {hoveredPoint.region_id && <p className="text-slate-500 text-[9px] font-bold">{hoveredPoint.region_id}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* History Table / Cards */}
                <div className="bg-white rounded-2xl lg:rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden">
                  <div className="px-5 lg:px-8 py-3 lg:py-5 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-[10px] lg:text-xs font-black text-slate-600 uppercase tracking-widest">Riwayat Harga</h3>
                    <span className="text-[9px] lg:text-[10px] font-bold text-slate-400">{priceHistory.length} entri</span>
                  </div>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/20 border-b border-slate-100 sticky top-0">
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Toko / Pasar</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Wilayah</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Satuan</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Harga</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Supplier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...priceHistory].reverse().map((h) => (
                          <tr key={h.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="px-6 py-3.5 text-xs font-bold text-slate-600 whitespace-nowrap">
                              {h.price_date ? new Date(h.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </td>
                            <td className="px-6 py-3.5 text-xs font-medium text-slate-700">{h.shop_name || '-'}</td>
                            <td className="px-6 py-3.5 text-xs font-medium text-slate-500">{h.region_id || '-'}</td>
                            <td className="px-6 py-3.5 text-xs font-bold text-slate-600 text-center">{h.unit}</td>
                            <td className="px-6 py-3.5 text-xs font-black text-slate-800 text-right">{formatRupiah(h.reference_price)}</td>
                            <td className="px-6 py-3.5 text-xs font-medium text-slate-500">{h.supplier_name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="lg:hidden divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {[...priceHistory].reverse().map((h) => (
                      <div key={h.id} className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800 text-sm">{h.shop_name || '-'}</p>
                          <span className="font-black text-slate-800">{formatRupiah(h.reference_price)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <span>{h.price_date ? new Date(h.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span>{h.region_id || '-'}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="uppercase">{h.unit}</span>
                          {h.supplier_name && (
                            <>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span>{h.supplier_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'master' && (
        <div className="space-y-5 lg:space-y-6">
          <div className="bg-white rounded-2xl lg:rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden">
            <div className="p-5 lg:p-6 border-b border-blue-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-sm lg:text-lg font-black text-slate-800 tracking-tight truncate">Master Komoditas</h2>
                <p className="text-slate-400 font-medium text-[10px] lg:text-xs mt-0.5 truncate">
                  Daftar semua komoditas bahan baku ({items?.length || 0} item).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="🔍 Cari komoditas..."
                  value={masterSearchQuery}
                  onChange={(e) => setMasterSearchQuery(e.target.value)}
                  className="w-full sm:w-60 pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {isAuthorized && (
                  <button 
                    type="button"
                    onClick={openAddItem}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Tambah</span>
                  </button>
                )}
              </div>
            </div>

            {loadingItems ? (
              <div className="py-12 text-center">
                <Loader2 className="animate-spin mx-auto text-blue-600" size={24} />
              </div>
            ) : items.filter(c => c && (c.nama || '').toLowerCase().includes((masterSearchQuery || '').toLowerCase())).length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm">
                {masterSearchQuery ? 'Komoditas tidak ditemukan.' : 'Belum ada data komoditas.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-blue-50">
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Nama</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Satuan</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                        {isAuthorized && <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.filter(c => c && (c.nama || '').toLowerCase().includes((masterSearchQuery || '').toLowerCase())).map((commodity, idx) => (
                        <tr key={commodity.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 text-sm">{commodity.nama}</p>
                            {commodity.deskripsi && <p className="text-[10px] text-slate-400 mt-0.5">{commodity.deskripsi}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                              {commodity.kategori || 'Umum'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600 text-xs">
                            {commodity.satuan_default || 'kg'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                              commodity.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'
                            }`}>
                              {commodity.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          {isAuthorized && (
                            <td className="px-6 py-4 text-center space-x-1 whitespace-nowrap">
                              <button 
                                type="button"
                                onClick={() => openEditItem(commodity)} 
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                                title="Edit Komoditas"
                              >
                                <Edit2 size={14} />
                              </button>
                              {isAdmin && (
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteItem(commodity.id)} 
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                                  title="Hapus Komoditas"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {items.filter(c => c && (c.nama || '').toLowerCase().includes((masterSearchQuery || '').toLowerCase())).map((commodity, idx) => (
                    <div key={commodity.id || idx} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{commodity.nama}</p>
                          {commodity.deskripsi && <p className="text-[10px] text-slate-400 truncate">{commodity.deskripsi}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isAuthorized && (
                            <>
                              <button 
                                type="button"
                                onClick={() => openEditItem(commodity)} 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                                title="Edit Komoditas"
                              >
                                <Edit2 size={13} />
                              </button>
                              {isAdmin && (
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteItem(commodity.id)} 
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                                  title="Hapus Komoditas"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg uppercase">
                          {commodity.kategori || 'Umum'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{commodity.satuan_default || 'kg'}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase ${
                          commodity.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'
                        }`}>
                          {commodity.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for add/edit commodity */}
      <FormModal
        isOpen={showModal}
        onClose={closeModal}
        title={editItemId ? 'Edit Komoditas' : 'Komoditas Baru'}
        onSubmit={handleAddItem}
        isLoading={isCreating || isUpdating}
        submitLabel={editItemId ? 'Simpan Perubahan' : 'Tambah Komoditas'}
      >
        <form onSubmit={handleAddItem} className="space-y-5" id="commodity-form">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nama Komoditas</label>
            <input type="text" required placeholder="Contoh: Beras Premium"
              value={itemForm.nama}
              onChange={(e) => setItemForm(prev => ({ ...prev, nama: e.target.value }))}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kategori</label>
              <select value={itemForm.kategori}
                onChange={(e) => setItemForm(prev => ({ ...prev, kategori: e.target.value }))}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm appearance-none">
                <option value="">Pilih kategori</option>
                {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Satuan Default</label>
              <select value={itemForm.satuan_default}
                onChange={(e) => setItemForm(prev => ({ ...prev, satuan_default: e.target.value }))}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm appearance-none">
                {UNIT_CATEGORIES.map(cat => (
                  <optgroup key={cat.label} label={cat.label}>
                    {cat.units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Status Komoditas</label>
            <select value={itemForm.is_active ? 'active' : 'inactive'}
              onChange={(e) => setItemForm(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm appearance-none">
              <option value="active">🟢 Aktif (Dapat Disurvey)</option>
              <option value="inactive">🔴 Nonaktif</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Deskripsi (Opsional)</label>
            <textarea value={itemForm.deskripsi}
              onChange={(e) => setItemForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Catatan tambahan tentang komoditas ini"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm resize-none" rows={3} />
          </div>
        </form>
      </FormModal>

      {/* Excel Survey Import Modal */}
      <ExcelSurveyImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        existingCommodities={items}
        currentUser={profile}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['komoditas'] });
          fetchSurveySessions();
        }}
      />
    </div>
  );
};

export default KomoditasHarga;
