import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Plus, X, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchableCommoditySelect = ({
  items = [],
  selectedId = null,
  onSelect,
  placeholder = '🔍 Pilih / Cari Komoditas...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedCommodity = items.find(i => i.id === selectedId);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredItems = items.filter(i => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = (i.nama || '').toLowerCase().includes(term);
    const catMatch = (i.kategori || '').toLowerCase().includes(term);
    return nameMatch || catMatch;
  });

  const handleSelectCommodity = (commodity) => {
    onSelect(commodity);
    setIsOpen(false);
  };

  const handleSelectCustom = () => {
    onSelect(null); // null indicates custom item
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium outline-none transition-all flex items-center justify-between text-left ${
            isOpen ? 'bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="truncate flex items-center gap-2">
            <Package size={14} className={selectedCommodity ? 'text-blue-600' : 'text-slate-400'} />
            {selectedCommodity ? (
              <span className="font-bold text-slate-800 truncate">
                {selectedCommodity.nama}
                {selectedCommodity.kategori && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded-md uppercase">
                    {selectedCommodity.kategori}
                  </span>
                )}
              </span>
            ) : selectedId === null ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                ➕ Barang Custom / Lainnya
              </span>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </span>
          <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </button>

        {selectedCommodity && (
          <button
            type="button"
            title="Reset Pilihan"
            onClick={() => onSelect(null)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all shrink-0"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Floating Dropdown List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 flex flex-col gap-2 max-h-[260px] min-w-[240px]"
          >
            {/* Search Input Box */}
            <div className="relative shrink-0">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketik nama komoditas..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* List of Options */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
              {/* Option 1: Custom Item */}
              <button
                type="button"
                onClick={handleSelectCustom}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between text-amber-700 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/50 mb-1"
              >
                <span className="flex items-center gap-1.5">
                  <Plus size={13} className="text-amber-600 shrink-0" />
                  Barang Custom (Ketik Nama Manual)
                </span>
                {selectedId === null && <Check size={13} className="text-amber-600" />}
              </button>

              {filteredItems.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs font-medium">
                  Tidak ditemukan "{searchTerm}"
                  <button
                    type="button"
                    onClick={handleSelectCustom}
                    className="block mx-auto mt-2 text-blue-600 hover:underline font-bold text-xs"
                  >
                    Gunakan "{searchTerm}" sebagai Barang Custom
                  </button>
                </div>
              ) : (
                filteredItems.map((ci) => {
                  const isSelected = selectedId === ci.id;
                  return (
                    <button
                      key={ci.id}
                      type="button"
                      onClick={() => handleSelectCommodity(ci)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2 flex items-center gap-1.5">
                        <span className="truncate">{ci.nama}</span>
                        {ci.satuan_default && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {ci.satuan_default}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ci.kategori && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {ci.kategori}
                          </span>
                        )}
                        {isSelected && <Check size={13} className="text-white shrink-0" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableCommoditySelect;
