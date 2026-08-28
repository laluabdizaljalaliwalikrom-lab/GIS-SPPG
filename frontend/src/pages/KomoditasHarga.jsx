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
  CandlestickChart, TrendingDown, LayoutGrid, List, X,
  Camera, FileCheck, CheckCircle2, Image as ImageIcon, Eye,
  Bookmark, RotateCcw, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import FormModal from '../components/FormModal';
import SearchableCommoditySelect from '../components/SearchableCommoditySelect';
import ExcelSurveyImportModal from '../components/ExcelSurveyImportModal';
import { compressImage, formatFileSize } from '../utils/imageCompressor';

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
    allPrices = [],
    submitSurvey, isSubmitting,
  } = useKomoditas();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedChartItem, setSelectedChartItem] = useState('');
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
    head_of_market_name: '',
    official_doc_url: null,
    documentation_photos: [],
    notes: '',
  });
  const [uploadedPhotos, setUploadedPhotos] = useState([]); // [{ file, previewUrl, originalSize, compressedSize, savedPercent, isCompressed }]
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [previewMediaModal, setPreviewMediaModal] = useState(null); // { type: 'photo' | 'doc', url: string, title: string }
  const [surveyItems, setSurveyItems] = useState([]);

  // Initialize draft safely with lazy initializer (no cascading renders)
  const [draftInfo, setDraftInfo] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('gis_sppg_survey_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && (parsed.items?.length > 0 || parsed.form?.shop_name)) {
          return {
            savedAt: parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'sebelumnya',
            itemCount: parsed.items?.length || 0,
            shopName: parsed.form?.shop_name || 'Tanpa Nama',
            data: parsed
          };
        }
      }
    } catch (err) {
      console.warn('Failed to parse survey draft:', err);
    }
    return null;
  });
  const [showDraftPromptModal, setShowDraftPromptModal] = useState(false);

  const handleOpenSurveyTab = () => {
    setActiveTab('survey');
    if (draftInfo && surveyItems.length === 0 && !surveyForm.shop_name) {
      setShowDraftPromptModal(true);
    }
  };

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [surveySessions, setSurveySessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [sessionItems, setSessionItems] = useState({});
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editPriceForm, setEditPriceForm] = useState({ item_name: '', reference_price: '', unit: 'kg', supplier_name: '' });

  // State for Dedicated History Details Modal
  const [historyModalData, setHistoryModalData] = useState(null); // { item_name, meta, history: [], loading: boolean }

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

  const handleOpenHistoryModal = async (itemName) => {
    const matchedMeta = items.find(i => i.nama.toLowerCase().trim() === itemName.toLowerCase().trim());

    // Filter local prices first as initial state
    const initialHist = allPrices
      .filter(p => p.item_name.toLowerCase().trim() === itemName.toLowerCase().trim() || (matchedMeta && p.commodity_item_id === matchedMeta.id))
      .sort((a, b) => new Date(b.price_date || b.created_at) - new Date(a.price_date || a.created_at));

    setHistoryModalData({
      item_name: itemName,
      meta: matchedMeta,
      history: initialHist,
      loading: true,
    });

    try {
      const res = await api.get('/audit/market-prices/history', { params: { item_name: itemName } });
      const apiHist = Array.isArray(res.data) ? res.data : [];
      setHistoryModalData(prev => prev ? {
        ...prev,
        history: apiHist.length > 0 ? apiHist : initialHist,
        loading: false,
      } : null);
    } catch {
      setHistoryModalData(prev => prev ? { ...prev, loading: false } : null);
    }
  };

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
    // Cek duplikat di sisi klien sebelum request
    const isDuplicate = items.some(i =>
      i.nama.toLowerCase().trim() === itemForm.nama.toLowerCase().trim() &&
      i.id !== editItemId
    );
    if (isDuplicate) {
      toast.error(`Komoditas "${itemForm.nama.trim()}" sudah ada di master data.`);
      return;
    }
    try {
      if (editItemId) {
        await updateItem({ id: editItemId, data: itemForm });
      } else {
        await createItem(itemForm);
      }
      closeModal();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 409 || (detail && detail.includes('sudah ada'))) {
        toast.error(detail || `Komoditas "${itemForm.nama}" sudah ada di master data.`);
      }
      // other errors handled by mutation onError
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

  // Handle adding photos with client-side compression
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

  const handleUploadOfficialDocDirect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Mengompresi dan mengunggah dokumen pengesahan...');
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        const comp = await compressImage(file, {
          maxWidth: 1800,
          maxHeight: 1800,
          quality: 0.82,
          mimeType: 'image/webp'
        });
        fileToUpload = comp.file;
      }

      const formData = new FormData();
      formData.append('files', fileToUpload);

      const { data } = await api.post('/commodities/survey/upload-documentation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = data.uploaded_photos?.[0]?.url || data.url;
      if (uploadedUrl) {
        setSurveyForm(prev => ({ ...prev, official_doc_url: uploadedUrl }));
        toast.success('Dokumen pengesahan berhasil diunggah!', { id: toastId });
      } else {
        toast.error('Gagal mendapatkan URL dokumen yang diunggah.', { id: toastId });
      }
    } catch (err) {
      console.error('Error uploading official doc:', err);
      toast.error('Gagal mengunggah dokumen pengesahan.', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const removeUploadedPhoto = (index) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Draft Management Handlers
  const handleSaveDraft = () => {
    try {
      const draftPayload = {
        form: surveyForm,
        items: surveyItems,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('gis_sppg_survey_draft', JSON.stringify(draftPayload));
      setDraftInfo({
        savedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        itemCount: surveyItems.length,
        shopName: surveyForm.shop_name || 'Tanpa Nama',
        data: draftPayload
      });
      toast.success('Draft survey berhasil disimpan di perangkat lokal!', { icon: '💾' });
    } catch (err) {
      console.error('Failed to save survey draft:', err);
      toast.error('Gagal menyimpan draft survey.');
    }
  };

  const handleRestoreDraft = () => {
    if (!draftInfo?.data) return;
    const { form, items: dItems } = draftInfo.data;
    if (form) {
      setSurveyForm(prev => ({
        ...prev,
        ...form,
        survey_session_id: form.survey_session_id || prev.survey_session_id
      }));
    }
    if (Array.isArray(dItems) && dItems.length > 0) {
      setSurveyItems(dItems);
    }
    toast.success('Draft survey berhasil dipulihkan!');
  };

  const handleClearDraft = () => {
    localStorage.removeItem('gis_sppg_survey_draft');
    setDraftInfo(null);
    toast.success('Draft survey telah dibersihkan.');
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

    let finalPhotoUrls = surveyForm.documentation_photos || [];

    // If there are newly selected local compressed photos, upload them to server first
    if (uploadedPhotos.length > 0) {
      setIsUploadingPhotos(true);
      const formData = new FormData();
      uploadedPhotos.forEach(p => {
        formData.append('files', p.file);
      });

      try {
        const { data } = await api.post('/commodities/survey/upload-documentation', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const newUrls = (data.uploaded_photos || []).map(p => p.url);
        finalPhotoUrls = [...finalPhotoUrls, ...newUrls];
      } catch (err) {
        console.error('Failed to upload photos:', err);
        toast.error('Peringatan: Gagal mengunggah beberapa foto dokumentasi, melanjutkan simpan data harga.');
      } finally {
        setIsUploadingPhotos(false);
      }
    }

    const payload = {
      ...surveyForm,
      shop_name: surveyForm.shop_name.trim(),
      region_id: surveyForm.region_id.trim(),
      surveyor_name: surveyForm.surveyor_name ? surveyForm.surveyor_name.trim() : null,
      head_of_market_name: surveyForm.head_of_market_name ? surveyForm.head_of_market_name.trim() : null,
      official_doc_url: surveyForm.official_doc_url || null,
      documentation_photos: finalPhotoUrls,
      notes: surveyForm.notes ? surveyForm.notes.trim() : null,
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
        // Clear saved draft on successful submission
        localStorage.removeItem('gis_sppg_survey_draft');
        setDraftInfo(null);

        setSurveyItems([]);
        setUploadedPhotos([]);
        setSurveyForm(prev => ({
          ...prev,
          survey_session_id: `SURVEY-${new Date().getTime()}`,
          surveyor_name: profile?.full_name || '',
          shop_name: '',
          head_of_market_name: '',
          official_doc_url: null,
          documentation_photos: [],
          notes: '',
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
    <div className="space-y-5 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Harga Bahan Baku & Komoditas</h1>
          <p className="page-subtitle">Pantau fluktuasi harga pasar, data survei lapangan, dan acuan resmi NTB.</p>
        </div>

        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 overflow-x-auto no-scrollbar w-fit">
          <div className="flex items-center gap-1 min-w-max">
            <button onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              <BarChart3 size={14} className={activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Dashboard</span>
            </button>
            <button onClick={() => { setActiveTab('ntb-live'); fetchNtbLivePrices(); }}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'ntb-live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              <Globe size={14} className={activeTab === 'ntb-live' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Harga NTB</span>
            </button>
            <button onClick={handleOpenSurveyTab}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'survey' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              <ShoppingCart size={14} className={activeTab === 'survey' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Input Survey</span>
            </button>
            <button onClick={() => { setActiveTab('data-survey'); fetchSurveySessions(); }}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'data-survey' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              <Database size={14} className={activeTab === 'data-survey' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Data Survey</span>
            </button>
            <button onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              <History size={14} className={activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Riwayat</span>
            </button>
            <button onClick={() => setActiveTab('master')}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'master' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              <Package size={14} className={activeTab === 'master' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Komoditas</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Simple & Clean Search Hero */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
            <div className="max-w-2xl mx-auto space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                Pencarian Cepat Bahan Baku
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Cari Harga Komoditas & Survei Pasar
              </h2>
              <p className="text-slate-500 text-xs font-medium">
                Ketik nama bahan pangan untuk melihat data harga & riwayat survei lapangan.
              </p>
            </div>

            {/* Clean Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all px-4 py-2.5">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama bahan makanan... (misal: Ayam, Beras, Telur)"
                  className="w-full pl-3 pr-6 bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition-all shrink-0"
                    title="Hapus pencarian"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Quick Keyword Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs font-medium text-slate-500">
                <span className="text-slate-400 text-[11px]">Paling dicari:</span>
                {['Ayam', 'Beras', 'Telur', 'Minyak', 'Daging Sapi', 'Bawang', 'Cabai', 'Ikan'].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setSearchQuery(kw)}
                    className={`px-2.5 py-1 rounded-md text-xs border transition-all ${searchQuery.toLowerCase() === kw.toLowerCase()
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          </div>



          {/* Quick Metrics Bar (Clean SaaS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Komoditas</p>
                <p className="text-base font-bold text-slate-900">{items.length} Item</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <BarChart3 size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tercatat</p>
                <p className="text-base font-bold text-slate-900">{allPrices.length} Harga</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShoppingCart size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sesi Survei</p>
                <p className="text-base font-bold text-slate-900">
                  {new Set(allPrices.filter(p => p.survey_session_id).map(p => p.survey_session_id)).size} Sesi
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Wilayah</p>
                <p className="text-base font-bold text-slate-900">
                  {new Set(allPrices.map(p => p.region_id).filter(Boolean)).size || 1} Pasar
                </p>
              </div>
            </div>
          </div>


          {/* Search Results / Recently Surveyed Commodities List */}
          {(() => {
            const query = searchQuery.toLowerCase().trim();

            // Extract items that have survey prices and group them by most recently surveyed
            const surveyedMap = new Map();
            allPrices.forEach((price) => {
              const nameKey = (price.item_name || '').toLowerCase().trim();
              if (!nameKey) return;
              if (!surveyedMap.has(nameKey)) {
                surveyedMap.set(nameKey, {
                  item_name: price.item_name,
                  commodity_item_id: price.commodity_item_id,
                  latest_price: price.reference_price,
                  unit: price.unit || 'kg',
                  shop_name: price.shop_name,
                  region_id: price.region_id,
                  price_date: price.price_date,
                  surveyor_name: price.surveyor_name,
                  created_at: price.created_at,
                  all_history: [price]
                });
              } else {
                const existing = surveyedMap.get(nameKey);
                existing.all_history.push(price);
                const existingTime = new Date(existing.price_date || existing.created_at).getTime();
                const newTime = new Date(price.price_date || price.created_at).getTime();
                if (newTime > existingTime) {
                  existing.latest_price = price.reference_price;
                  existing.unit = price.unit || existing.unit;
                  existing.shop_name = price.shop_name;
                  existing.region_id = price.region_id;
                  existing.price_date = price.price_date;
                  existing.surveyor_name = price.surveyor_name;
                  existing.created_at = price.created_at;
                }
              }
            });

            // If some items in master are surveyed or not yet surveyed, combine gracefully
            const surveyedList = Array.from(surveyedMap.values()).sort(
              (a, b) => new Date(b.price_date || b.created_at) - new Date(a.price_date || a.created_at)
            );

            // Filter based on search query
            const matchingSurveyed = surveyedList.filter(item => {
              if (!query) return true;
              const nameMatch = (item.item_name || '').toLowerCase().includes(query);
              const shopMatch = (item.shop_name || '').toLowerCase().includes(query);
              const regionMatch = (item.region_id || '').toLowerCase().includes(query);
              return nameMatch || shopMatch || regionMatch;
            });

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      {query ? `Hasil Pencarian untuk "${searchQuery}"` : 'Daftar Harga Bahan Baku yang Baru Disurvei'}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                      {matchingSurveyed.length} Item Terdata
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {query && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Reset Pencarian
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExportPrices}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                    >
                      <Download size={13} /> Export Excel
                    </button>
                  </div>
                </div>

                {matchingSurveyed.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                      <Search size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">
                      {query ? `Tidak ada hasil survey dengan kata "${searchQuery}"` : 'Belum ada data harga survei tercatat'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {query ? 'Coba gunakan kata kunci bahan baku lain.' : 'Lakukan survei harga baru melalui tab "Input Survey" atau "Import Excel".'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchingSurveyed.map((surveyItem, idx) => {
                      const matchedMeta = items.find(i => i.nama.toLowerCase().trim() === surveyItem.item_name.toLowerCase().trim());

                      // Sort history to calculate price diff
                      const sortedHist = (surveyItem.all_history || []).sort((a, b) => new Date(b.price_date || b.created_at) - new Date(a.price_date || a.created_at));
                      const latest = sortedHist[0];
                      const prev = sortedHist[1];

                      let diff = 0;
                      let diffPct = 0;
                      if (latest && prev && prev.reference_price > 0) {
                        diff = latest.reference_price - prev.reference_price;
                        diffPct = (diff / prev.reference_price) * 100;
                      }

                      return (
                        <div
                          key={idx}
                          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2.5">
                            {/* Header Item */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-md">
                                  {matchedMeta?.kategori || 'Bahan Pangan'}
                                </span>
                                <h4 className="text-base font-black text-slate-800 mt-1 flex items-center gap-1.5">
                                  <Package size={16} className="text-blue-500 shrink-0" />
                                  {surveyItem.item_name}
                                </h4>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                /{surveyItem.unit || 'kg'}
                              </span>
                            </div>

                            {/* Price Section */}
                            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Harga Hasil Survei Terbaru</p>
                              <div>
                                <div className="flex items-baseline justify-between">
                                  <span className="text-xl lg:text-2xl font-black text-blue-600">
                                    {formatRupiah(surveyItem.latest_price)}
                                  </span>
                                  {diff !== 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${diff > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                      }`}>
                                      {diff > 0 ? `▲ +${diffPct.toFixed(1)}%` : `▼ ${diffPct.toFixed(1)}%`}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-2 mt-1.5 border-t border-slate-200/60">
                                  <span className="truncate max-w-[150px] font-bold text-slate-700">📍 {surveyItem.shop_name || 'Pasar'}</span>
                                  <span className="font-bold text-slate-500">📅 {surveyItem.price_date ? new Date(surveyItem.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold text-slate-400">
                              {sortedHist.length} Catatan Survei
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenHistoryModal(surveyItem.item_name)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 hover:underline active:scale-95 transition-all"
                            >
                              Lihat Riwayat <ArrowUpRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'ntb-live' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      <Radio size={10} className="animate-pulse text-emerald-600" /> Live Sinkronisasi
                    </span>
                    <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {ntbLivePrices.length} Komoditas
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    Harga Pangan Acuan Disperindag NTB & SP2KP
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-xl">
                    Pantauan harga rata-rata bahan pokok resmi se-NTB sebagai standar acuan audit & RAB SPPG.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchNtbLivePrices}
                  disabled={loadingLiveNtb}
                  className="btn-secondary text-xs"
                >
                  <RefreshCw size={13} className={loadingLiveNtb ? 'animate-spin' : ''} />
                  <span>Segarkan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stat Strip */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Package size={18} /></div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Komoditas</p>
                <p className="text-base font-bold text-slate-900">{ntbLivePrices.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><TrendingUp size={18} /></div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Kenaikan Harga</p>
                <p className="text-base font-bold text-rose-600">{ntbLivePrices.filter(i => i.status_tren === 'NAIK').length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><TrendingDown size={18} /></div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Penurunan Harga</p>
                <p className="text-base font-bold text-emerald-600">{ntbLivePrices.filter(i => i.status_tren === 'TURUN').length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Minus size={18} /></div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Harga Stabil</p>
                <p className="text-base font-bold text-slate-900">{ntbLivePrices.filter(i => i.status_tren === 'STABIL' || !i.status_tren).length}</p>
              </div>
            </div>
          </div>

          {/* Clean Light Filter & View Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Cari komoditas acuan NTB..."
                  value={ntbSearchQuery}
                  onChange={(e) => setNtbSearchQuery(e.target.value)}
                  className="input text-xs"
                />
                {ntbSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setNtbSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
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
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${selectedNtbCategory === cat
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
                        className={`text-left p-4 lg:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative group ${isSelected
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

                          <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shrink-0 ${isNaik ? 'bg-rose-50 text-rose-600 border border-rose-200' :
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
                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/70 font-bold' : 'hover:bg-slate-50/80'
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
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg uppercase ${isNaik ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                  isTurun ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                    'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                {isNaik ? <ArrowUpRight size={12} /> : isTurun ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                                {item.perubahan !== 0 ? `${item.perubahan > 0 ? '+' : ''}${item.perubahan}%` : 'STABIL'}
                              </span>
                            </td>
                            <td className={`px-5 py-4 text-right font-black text-xs ${isNaik ? 'text-rose-600' : isTurun ? 'text-emerald-600' : 'text-slate-400'
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
                <div className="bg-white rounded-xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-slate-200">
                  {/* Header */}
                  <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 text-slate-900 flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                        <CandlestickChart size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{selectedNtbItem.kategori}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">{selectedNtbItem.komoditas}</h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedNtbItem(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all shrink-0"
                      aria-label="Tutup modal"
                    >
                      <X size={18} />
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
        <div className="space-y-5">
          {/* Header Card — Data Survey */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800">Input Survey Pasar</h2>
                  <p className="text-slate-400 text-[11px] font-medium hidden sm:block">Catat harga bahan baku secara manual atau via Excel.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all border border-slate-200"
                  title="Simpan sementara di browser"
                >
                  <Bookmark size={14} className="text-amber-500" />
                  Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={() => setShowExcelModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  <FileSpreadsheet size={14} />
                  Import Excel
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Draft Available Alert Banner */}
              {draftInfo && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bookmark size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Draft: {draftInfo.shopName} · {draftInfo.itemCount} item · pukul {draftInfo.savedAt}
                      </h4>
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        Ada draf yang belum dikirim ke server. Ingin melanjutkan?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-11 sm:ml-0">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RotateCcw size={12} />
                      Pulihkan
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="p-2 text-amber-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Buang Draft"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}

              <form id="survey-form" onSubmit={handleSubmitSurvey} className="space-y-5">
                {/* Informasi Dasar */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <User size={11} /> Informasi Dasar
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
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
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Surveyor</label>
                      <input type="text" placeholder="Nama petugas"
                        value={surveyForm.surveyor_name}
                        onChange={(e) => setSurveyForm(prev => ({ ...prev, surveyor_name: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium text-sm" />
                    </div>
                  </div>
                </div>

                {/* Optional: Dokumentasi */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Dokumentasi & Pengesahan</span>
                      <span className="text-[10px] text-slate-400 font-medium">(opsional)</span>
                    </div>
                    {surveyForm.official_doc_url && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black">
                        <CheckCircle2 size={11} /> Tersimpan
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nama Kepala Pasar / Pengesah</label>
                        <input
                          type="text"
                          placeholder="Contoh: H. Ahmad Fauzi"
                          value={surveyForm.head_of_market_name}
                          onChange={(e) => setSurveyForm(prev => ({ ...prev, head_of_market_name: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Catatan Survey</label>
                        <input
                          type="text"
                          placeholder="Kondisi pasar, stok, dll."
                          value={surveyForm.notes}
                          onChange={(e) => setSurveyForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                    </div>

                    {/* Upload Dokumen */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Dokumen Pengesahan Scan</label>
                      {surveyForm.official_doc_url ? (
                        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <span className="font-bold text-emerald-800 text-sm flex items-center gap-2 truncate">
                            <FileCheck size={15} className="text-emerald-600 shrink-0" />
                            Berkas Tersimpan
                          </span>
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            <button type="button"
                              onClick={() => setPreviewMediaModal({ type: 'doc', url: surveyForm.official_doc_url, title: `Pengesahan: ${surveyForm.shop_name || 'Survey'}` })}
                              className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all" title="Pratinjau">
                              <ExternalLink size={14} />
                            </button>
                            <button type="button"
                              onClick={() => setSurveyForm(prev => ({ ...prev, official_doc_url: null }))}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Hapus">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <label htmlFor="upload-official-doc-direct"
                            className="cursor-pointer w-full px-4 py-3 bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 rounded-xl text-sm font-bold text-indigo-600 flex items-center justify-center gap-2 transition-all">
                            <FileCheck size={15} /> Upload Dokumen Pengesahan
                          </label>
                          <input id="upload-official-doc-direct" type="file" accept="image/*,application/pdf"
                            onChange={handleUploadOfficialDocDirect} className="hidden" />
                        </>
                      )}
                    </div>

                    {/* Upload Foto */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon size={12} className="text-slate-400" />
                          Foto Kegiatan ({uploadedPhotos.length + (surveyForm.documentation_photos?.length || 0)} foto)
                        </label>
                        <label htmlFor="survey-photo-upload"
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all">
                          <Plus size={12} /> Tambah Foto
                        </label>
                        <input id="survey-photo-upload" type="file" multiple accept="image/*"
                          onChange={handleAddDocumentationPhotos} className="hidden" />
                      </div>
                      {uploadedPhotos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {uploadedPhotos.map((p, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-sm">
                              <img src={p.previewUrl} alt="Dokumentasi" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                                <button type="button" onClick={() => removeUploadedPhoto(idx)}
                                  className="self-end p-1 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                  <Trash2 size={11} />
                                </button>
                                <span className="text-[9px] text-white font-bold truncate">{formatFileSize(p.compressedSize)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="text-sm font-black text-slate-800 whitespace-nowrap">Daftar Harga</h2>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg shrink-0">
                  {surveyItems.length} item
                </span>
              </div>
              <button onClick={addSurveyItemRow}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-200 transition-all shrink-0">
                <Plus size={13} /> Tambah Item
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {surveyItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">Belum ada item.</p>
                  <p className="text-slate-300 text-xs mt-1">Tap "Tambah Item" untuk mulai mencatat harga.</p>
                </div>
              ) : (
                surveyItems.map((item, idx) => {
                  const harga = parseFloat(item.reference_price) || 0;
                  const qty = parseFloat(item.qty) || 0;
                  const subtotal = harga * qty;
                  const isCustom = !item.commodity_item_id;
                  return (
                    <div key={item.tempId} className="border border-slate-200 rounded-2xl p-3 sm:p-4 bg-slate-50/40 hover:border-blue-200 transition-all">
                      {/* Item header: nomor + delete */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-6 h-6 bg-blue-600 text-white text-[10px] font-black rounded-lg flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <button type="button" onClick={() => removeSurveyItem(item.tempId)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Commodity Selector + Name + Supplier */}
                      <div className="space-y-2 mb-3">
                        <SearchableCommoditySelect
                          items={items}
                          selectedId={item.commodity_item_id}
                          onSelect={(commodity) => selectCommodityForSurvey(item.tempId, commodity)}
                        />
                        {isCustom ? (
                          <input type="text" required placeholder="Nama barang (custom)"
                            value={item.item_name}
                            onChange={(e) => updateSurveyItem(item.tempId, 'item_name', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all" />
                        ) : (
                          <div className="flex items-center px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-700 truncate">
                            {item.item_name || '-'}
                          </div>
                        )}
                        <input type="text" placeholder="Supplier / Pedagang (opsional)"
                          value={item.supplier_name}
                          onChange={(e) => updateSurveyItem(item.tempId, 'supplier_name', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all" />
                      </div>

                      {/* Harga, Satuan, Qty, Subtotal — 2 col on mobile, 4 on md */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Harga (Rp)</label>
                          <input type="number" required placeholder="14000"
                            value={item.reference_price}
                            onChange={(e) => updateSurveyItem(item.tempId, 'reference_price', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Satuan</label>
                          <select value={item.unit}
                            onChange={(e) => updateSurveyItem(item.tempId, 'unit', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none appearance-none focus:border-blue-400 transition-all">
                            {UNIT_CATEGORIES.map(cat => (
                              <optgroup key={cat.label} label={cat.label}>
                                {cat.units.map(u => <option key={u} value={u}>{u}</option>)}
                              </optgroup>
                            ))}
                            <option value="custom">➕ Lainnya...</option>
                          </select>
                          {item.unit === 'custom' && (
                            <input type="text" required placeholder="Ketik satuan..."
                              value={item.custom_unit || ''}
                              onChange={(e) => updateSurveyItem(item.tempId, 'custom_unit', e.target.value)}
                              className="w-full mt-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium outline-none" />
                          )}
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Qty</label>
                          <input type="number" step="0.01" min="0.01" value={item.qty}
                            onChange={(e) => updateSurveyItem(item.tempId, 'qty', e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Subtotal</label>
                          <div className="h-[42px] flex items-center px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black text-emerald-700">
                            {subtotal > 0 ? formatRupiah(subtotal) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Inline bottom "Tambah Item" — visible after scrolling past all items */}
            <div className="px-4 pb-3 sm:px-5">
              <button
                onClick={addSurveyItemRow}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-blue-200 text-blue-500 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/60 font-bold text-sm transition-all"
              >
                <Plus size={16} />
                Tambah Item Harga
              </button>
            </div>

            {/* Footer: Summary + Save buttons */}
            {surveyItems.length > 0 && (
              <div className="px-4 py-4 sm:px-6 border-t border-slate-100 bg-slate-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    <span className="font-black text-slate-800">{surveyItems.length} item</span>
                    <span className="mx-1.5 text-slate-300">·</span>
                    Total <span className="font-black text-emerald-700">{formatRupiah(surveyItems.reduce((sum, i) => sum + ((parseFloat(i.reference_price) || 0) * (parseFloat(i.qty) || 0)), 0))}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button type="button" onClick={handleSaveDraft}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition-all">
                      <Bookmark size={13} className="text-amber-500" /> Draft
                    </button>
                    <button type="submit" form="survey-form" disabled={isSubmitting || isUploadingPhotos}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 text-xs transition-all disabled:opacity-50">
                      {isSubmitting || isUploadingPhotos ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
                      {isUploadingPhotos ? 'Mengunggah...' : `Simpan Survey (${surveyItems.filter(i => i.item_name && i.reference_price).length})`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Button — always visible on survey tab */}
          <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-2">
            {/* Quick-add FAB */}
            <button
              onClick={addSurveyItemRow}
              title="Tambah item harga baru"
              className="group flex items-center gap-0 overflow-hidden max-w-[3rem] hover:max-w-[200px] transition-all duration-300 ease-in-out h-12 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-500/30 font-bold text-sm"
            >
              <Plus size={20} className="shrink-0" />
              <span className="whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 group-hover:ml-2 transition-all duration-200 text-xs font-black uppercase tracking-wide">
                Tambah Item
              </span>
            </button>
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
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-slate-800 text-sm truncate">{session.shop_name || 'Tanpa Nama'}</h3>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md uppercase">{session.region_id || '-'}</span>
                            {session.official_doc_url && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md border border-emerald-200">
                                <FileCheck size={10} /> Disahkan
                              </span>
                            )}
                            {session.documentation_photos?.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-md border border-indigo-100">
                                <Camera size={10} /> {session.documentation_photos.length} Foto
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-medium">
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
                                  Petugas: {session.surveyor_name}
                                </span>
                              </>
                            )}
                            {session.head_of_market_name && (
                              <>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="flex items-center gap-1 text-blue-700 font-bold">
                                  <FileCheck size={10} />
                                  Pengesah: {session.head_of_market_name}
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

                      {/* Expanded Items & Attachments */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/30 p-4 space-y-4">
                          {/* Attachments Bar */}
                          {(session.official_doc_url || (session.documentation_photos && session.documentation_photos.length > 0) || session.notes) && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Camera size={12} className="text-indigo-600" />
                                  Bukti Fisik & Dokumentasi Survey
                                </span>
                                {session.notes && (
                                  <span className="text-xs text-slate-500 italic max-w-md truncate">
                                    "{session.notes}"
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                {/* Dokumen Pengesahan */}
                                {session.official_doc_url && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMediaModal({
                                      type: 'doc',
                                      url: session.official_doc_url,
                                      title: `Dokumen Pengesahan: ${session.shop_name}`
                                    })}
                                    className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-sm"
                                  >
                                    <FileCheck size={14} className="text-emerald-600" />
                                    Lihat Lembar Pengesahan ({session.head_of_market_name || 'Kepala Pasar'})
                                  </button>
                                )}

                                {/* Foto-foto Dokumentasi */}
                                {session.documentation_photos?.map((photoUrl, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setPreviewMediaModal({
                                      type: 'photo',
                                      url: photoUrl,
                                      title: `Dokumentasi Foto ${pIdx + 1}: ${session.shop_name}`
                                    })}
                                    className="relative group w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm shrink-0 hover:scale-105 transition-all"
                                  >
                                    <img src={photoUrl} alt={`Dokumentasi ${pIdx + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Eye size={12} />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
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
                      ['Tanggal', 'Toko', 'Wilayah', 'Satuan', 'Harga', 'Supplier'],
                      ...priceHistory.map(h => [h.price_date || '', h.shop_name || '', h.region_id || '', h.unit || '', h.reference_price, h.supplier_name || ''])
                    ].map(r => r.join(',')).join('\n');
                    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${selectedChartItem.replace(/\s+/g, '_')}_riwayat.csv`; a.click();
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
                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${commodity.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'
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
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase ${commodity.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'
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
              className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm ${
                itemForm.nama.trim() &&
                items.some(i => i.nama.toLowerCase().trim() === itemForm.nama.toLowerCase().trim() && i.id !== editItemId)
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-slate-200 focus:border-blue-600'
              }`} />
            {/* Inline duplicate warning */}
            {itemForm.nama.trim() &&
              items.some(i => i.nama.toLowerCase().trim() === itemForm.nama.toLowerCase().trim() && i.id !== editItemId) && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 text-[10px] font-black">!</span>
                Nama ini sudah ada di master data. Gunakan nama lain atau edit komoditas yang sudah ada.
              </p>
            )}
            {/* Suggestion: show matching existing items */}
            {itemForm.nama.trim().length >= 2 && !items.some(i => i.nama.toLowerCase().trim() === itemForm.nama.toLowerCase().trim() && i.id !== editItemId) && (() => {
              const similar = items.filter(i =>
                i.id !== editItemId &&
                i.nama.toLowerCase().includes(itemForm.nama.toLowerCase().trim())
              ).slice(0, 3);
              return similar.length > 0 ? (
                <div className="mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide mb-1.5">⚠ Komoditas Serupa:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {similar.map(s => (
                      <span key={s.id} className="px-2.5 py-1 bg-white border border-amber-200 text-amber-900 rounded-lg text-xs font-bold">
                        {s.nama}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
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

      {/* 🌟 Modal Riwayat Lengkap Komoditas (Clean & Beautiful) */}
      {historyModalData && createPortal(
        <div className="fixed inset-0 z-[999998] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 lg:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-300 backdrop-blur-sm border border-white/10 shrink-0">
                  <History size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-200 text-[10px] font-black uppercase rounded-lg">
                      {historyModalData.meta?.kategori || 'Bahan Baku'}
                    </span>
                    <span className="text-xs text-blue-200 font-bold">
                      Satuan: {historyModalData.meta?.satuan_default || historyModalData.history[0]?.unit || 'kg'}
                    </span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-black mt-0.5 tracking-tight flex items-center gap-2">
                    {historyModalData.item_name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHistoryModalData(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 lg:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {historyModalData.loading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
                  <p className="text-xs font-bold text-slate-500">Memuat seluruh data riwayat survei...</p>
                </div>
              ) : historyModalData.history.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                  <History className="mx-auto text-slate-300" size={36} />
                  <p className="text-sm font-bold text-slate-700">Belum ada riwayat survei</p>
                  <p className="text-xs text-slate-400">Komoditas ini belum pernah dicatat dalam survei harga lapang.</p>
                </div>
              ) : (
                <>
                  {/* Summary Highlights */}
                  {(() => {
                    const sorted = [...historyModalData.history].sort(
                      (a, b) => new Date(b.price_date || b.created_at) - new Date(a.price_date || a.created_at)
                    );
                    const prices = sorted.map(s => s.reference_price).filter(Boolean);
                    const latest = sorted[0];
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1));

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
                          <p className="text-[9px] font-black uppercase text-slate-400">Harga Terbaru</p>
                          <p className="text-lg lg:text-xl font-black text-blue-600 mt-0.5">
                            {formatRupiah(latest?.reference_price || 0)}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[9px] font-black uppercase text-slate-400">Rata-rata</p>
                          <p className="text-lg lg:text-xl font-black text-slate-800 mt-0.5">
                            {formatRupiah(avgPrice)}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                          <p className="text-[9px] font-black uppercase text-emerald-600">Terendah</p>
                          <p className="text-lg lg:text-xl font-black text-emerald-700 mt-0.5">
                            {formatRupiah(minPrice)}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm">
                          <p className="text-[9px] font-black uppercase text-rose-600">Tertinggi</p>
                          <p className="text-lg lg:text-xl font-black text-rose-700 mt-0.5">
                            {formatRupiah(maxPrice)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Riwayat Timeline List */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <BarChart3 size={15} className="text-blue-600" />
                        Log Seluruh Survei ({historyModalData.history.length} Catatan)
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">Terurut dari yang terbaru</span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {[...historyModalData.history]
                        .sort((a, b) => new Date(b.price_date || b.created_at) - new Date(a.price_date || a.created_at))
                        .map((entry, idx, arr) => {
                          const prevEntry = arr[idx + 1];
                          let diff = 0;
                          let diffPct = 0;
                          if (prevEntry && prevEntry.reference_price > 0) {
                            diff = entry.reference_price - prevEntry.reference_price;
                            diffPct = (diff / prevEntry.reference_price) * 100;
                          }

                          return (
                            <div key={entry.id || idx} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${idx === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    {idx === 0 ? 'Survei Terbaru' : `#${idx + 1}`}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700">
                                    📍 {entry.shop_name || 'Pasar / Toko Umum'}
                                  </span>
                                  {entry.region_id && (
                                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                      {entry.region_id}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                  <span>📅 {entry.price_date ? new Date(entry.price_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                                  {entry.surveyor_name && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-blue-600"><User size={12} /> {entry.surveyor_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="text-left sm:text-right self-start sm:self-center shrink-0">
                                <p className="text-base font-black text-blue-600">
                                  {formatRupiah(entry.reference_price)} <span className="text-[10px] text-slate-400 font-bold">/{entry.unit || 'kg'}</span>
                                </p>
                                {prevEntry && diff !== 0 && (
                                  <span className={`inline-block text-[10px] font-bold mt-0.5 px-1.5 py-0.5 rounded ${diff > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                    {diff > 0 ? `▲ +${formatRupiah(diff)} (+${diffPct.toFixed(1)}%)` : `▼ ${formatRupiah(Math.abs(diff))} (${diffPct.toFixed(1)}%)`}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const item = historyModalData.item_name;
                  setHistoryModalData(null);
                  setSelectedChartItem(item);
                  setActiveTab('history');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 hover:underline"
              >
                Buka di Tab Grafik Analisis Lengkap <ArrowUpRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setHistoryModalData(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ⚠️ Modal Peringatan Lanjutkan / Hapus Draft Survey */}
      {showDraftPromptModal && draftInfo && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-amber-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 border border-white/20 shadow-inner">
                <Bookmark size={24} />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-black/20 text-white text-[10px] font-black uppercase rounded-md tracking-wider">
                  Draf Tersimpan
                </span>
                <h3 className="text-lg font-black mt-0.5 tracking-tight text-white">
                  Lanjutkan Input Survei?
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 bg-slate-50/50">
              <p className="text-xs text-slate-600 leading-relaxed">
                Ditemukan draf survei sebelumnya di perangkat Anda yang belum dikirim ke server:
              </p>

              {/* Draft Info Card */}
              <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Toko / Pasar:</span>
                  <span className="font-black text-slate-800 text-sm">📍 {draftInfo.shopName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Jumlah Komoditas:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {draftInfo.itemCount} Item Bahan Baku
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Waktu Disimpan:</span>
                  <span className="font-medium text-slate-500">Pukul {draftInfo.savedAt}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-medium">
                Pilih <strong>Lanjutkan Pengisian</strong> untuk memulihkan seluruh data, atau <strong>Hapus Draf</strong> jika ingin memulai formulir baru dari awal.
              </p>
            </div>

            {/* Modal Action Buttons */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleClearDraft();
                  setShowDraftPromptModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all order-2 sm:order-1"
              >
                <Trash2 size={15} />
                Hapus Draf
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDraftPromptModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs transition-all order-3 sm:order-2"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  handleRestoreDraft();
                  setShowDraftPromptModal(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all order-1 sm:order-3"
              >
                <RotateCcw size={15} />
                Lanjutkan Pengisian
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Media Lightbox / Modal Preview */}
      {previewMediaModal && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <span className="text-xs font-bold truncate pr-4">{previewMediaModal.title}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewMediaModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 hover:text-white transition-all"
                  title="Buka di tab baru"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMediaModal(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 hover:text-white transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center bg-slate-950/20">
              {previewMediaModal.url?.endsWith('.pdf') ? (
                <iframe
                  src={previewMediaModal.url}
                  title="Pratinjau Dokumen"
                  className="w-full h-[70vh] rounded-xl border border-slate-200"
                />
              ) : (
                <img
                  src={previewMediaModal.url}
                  alt={previewMediaModal.title}
                  className="max-h-[75vh] w-auto object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default KomoditasHarga;
