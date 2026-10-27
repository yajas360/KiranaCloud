import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Check,
} from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, getCategoryColor } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import StockBadge from '../components/common/StockBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ProductModal from '../components/inventory/ProductModal';
import RestockModal from '../components/inventory/RestockModal';

const CATEGORIES = [
  'All',
  'Grocery & Staples',
  'Dairy & Bakery',
  'Beverages & Juices',
  'Snacks & Packaged Foods',
  'Personal Care',
  'Household & Cleaning',
  'Fruits & Vegetables',
  'Stationery & General',
  'Other',
];

const Inventory = () => {
  const { currency, currencySymbol } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState(null);

  // CSV Import/Export state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSummary, setImportSummary] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (stockStatus !== 'ALL') params.append('stockStatus', stockStatus);
      params.append('limit', '100');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedCategory, stockStatus]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const parseCSV = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length <= 1) return [];

    const parseRow = (str) => {
      const result = [];
      let insideQuotes = false;
      let entry = '';
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === '"') {
          if (insideQuotes && str[i + 1] === '"') {
            entry += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (c === ',' && !insideQuotes) {
          result.push(entry.trim());
          entry = '';
        } else {
          entry += c;
        }
      }
      result.push(entry.trim());
      return result;
    };

    const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      if (values.length === 0 || values.every((v) => v === '')) continue;
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const name = row.name || row.productname || values[0] || '';
      if (!name) continue;

      let rawUnit = (row.unit || values[6] || 'pcs').trim().toLowerCase();
      if (rawUnit === 'pack' || rawUnit === 'packs' || rawUnit === 'bag' || rawUnit === 'refill' || rawUnit === 'tetra') {
        rawUnit = 'packet';
      } else if (rawUnit === 'bottle' || rawUnit === 'bottles' || rawUnit === 'jar' || rawUnit === 'jars' || rawUnit === 'bar') {
        rawUnit = 'pcs';
      } else if (rawUnit === 'l' || rawUnit === 'litre' || rawUnit === 'litres' || rawUnit === 'liter' || rawUnit === 'ltr') {
        rawUnit = 'litres';
      } else if (rawUnit === 'g' || rawUnit === 'gram' || rawUnit === 'grams') {
        rawUnit = 'gm';
      } else if (!['pcs', 'kg', 'gm', 'litres', 'ml', 'packet', 'box', 'pack', 'bottle', 'can', 'liter', 'litre'].includes(rawUnit)) {
        rawUnit = 'pcs';
      }

      parsed.push({
        name,
        sku: row.sku || row.barcode || values[1] || '',
        category: row.category || values[2] || 'Other',
        sellingPrice: parseFloat(row.sellingprice || row.sp || values[3]) || 0,
        costPrice: parseFloat(row.costprice || row.cp || values[4]) || 0,
        stockQuantity: parseInt(row.stockquantity || row.stock || row.qty || values[5], 10) || 0,
        unit: rawUnit,
        minThreshold: parseInt(row.minthreshold || row.threshold || values[7], 10) || 5,
        supplier: row.supplier || values[8] || '',
      });
    }
    return parsed;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target.result;
        const rows = parseCSV(content);
        if (rows.length === 0) {
          setImportError('No valid product rows found in CSV. Please check formatting.');
          setParsedRows([]);
        } else {
          setParsedRows(rows);
        }
      } catch (err) {
        setImportError('Failed to parse CSV file. Ensure it is a valid CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    try {
      setImportLoading(true);
      setImportError(null);
      const res = await api.post('/products/bulk-import', { products: parsedRows });
      if (res.data.success) {
        setImportSummary(res.data);
        fetchProducts();
      }
    } catch (err) {
      setImportError(err.response?.data?.message || 'Bulk import failed.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/products/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kiranacloud_inventory_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export inventory CSV.');
    }
  };

  const handleDownloadSampleCSV = () => {
    const sample = `Name,SKU,Category,Selling Price,Cost Price,Stock Quantity,Unit,Min Threshold,Supplier
"Aashirvaad Whole Wheat Atta 5kg","GRO-ATT-001","Grocery & Staples",245,210,35,"pcs",10,"ITC Foods"
"Amul Taaza Milk 1L","DAI-MLK-002","Dairy & Bakery",72,64,40,"pcs",12,"Amul Dairy"
"Tata Salt 1kg","GRO-SLT-003","Grocery & Staples",28,22,50,"pcs",15,"Tata Consumer"
"Fortune Sunlite Sunflower Oil 1L","GRO-OIL-004","Grocery & Staples",155,138,25,"pcs",8,"Adani Wilmar"`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kiranacloud_products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minThreshold && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-zinc-300 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Inventory & Stock Catalog</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage wholesale costs, retail pricing, stock availability, and safety thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 rounded-none uppercase tracking-wider transition"
            title="Export all products to CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportFileName('');
              setParsedRows([]);
              setImportError(null);
              setImportSummary(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none uppercase tracking-wider transition shadow-sm active:translate-y-[1px]"
            title="Bulk import products from CSV"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          <Link
            to="/reorder-sheet"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 rounded-none uppercase tracking-wider transition shadow-sm active:translate-y-[1px]"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="hidden sm:inline">Reorder</span>
            {lowStockCount + outOfStockCount > 0 && ` (${lowStockCount + outOfStockCount})`}
          </Link>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:translate-y-[1px] rounded-none border border-blue-700 uppercase tracking-wider transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-none border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase tracking-wider"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase tracking-wider"
          >
            <option value="ALL" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">All Stock Statuses</option>
            <option value="LOW_STOCK" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Low Stock (&le; Buffer)</option>
            <option value="OUT_OF_STOCK" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Out of Stock (0 Left)</option>
            <option value="IN_STOCK" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Healthy Stock Only</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase tracking-wider"
          >
            <option value="default" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Sort: Default</option>
            <option value="price-asc" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Price: Low to High</option>
            <option value="price-desc" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Price: High to Low</option>
            <option value="name-asc" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Name: A to Z</option>
            <option value="stock-asc" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Stock: Low to High</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSpinner text="Loading inventory records..." size="md" />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory products found"
            description="Add your first grocery, dairy, or general item to the store catalog."
            actionLabel="Add Product"
            onAction={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-bold border-b-2 border-zinc-300 dark:border-zinc-700">
                <tr>
                  <th className="px-3.5 py-3 text-left whitespace-nowrap">Product & SKU</th>
                  <th className="px-2.5 py-3 whitespace-nowrap">Category</th>
                  <th className="px-2.5 py-3 text-right whitespace-nowrap">Cost</th>
                  <th className="px-2.5 py-3 text-right whitespace-nowrap">Price</th>
                  <th className="px-2.5 py-3 text-right whitespace-nowrap">Margin</th>
                  <th className="px-2.5 py-3 text-center whitespace-nowrap">Stock Level</th>
                  <th className="px-2.5 py-3 whitespace-nowrap">Location</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                {[...products]
                  .sort((a, b) => {
                    if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
                    if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
                    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
                    if (sortBy === 'stock-asc') return a.stockQuantity - b.stockQuantity;
                    return 0;
                  })
                  .map((p) => {
                    const marginAmount = p.sellingPrice - p.costPrice;
                    const marginPct =
                      p.sellingPrice > 0 ? Math.round((marginAmount / p.sellingPrice) * 100) : 0;

                    return (
                      <tr key={p._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition">
                        {/* Name & SKU */}
                        <td className="px-3 py-2.5 whitespace-nowrap min-w-0 max-w-[210px]">
                          <span className="font-bold text-zinc-900 dark:text-white block text-xs truncate" title={p.name}>
                            {p.name}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-zinc-400 dark:text-zinc-500 block truncate">
                            {p.sku}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-2.5 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold border whitespace-nowrap uppercase tracking-wider ${getCategoryColor(p.category)}`}>
                            {p.category}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="px-2.5 py-2.5 text-right text-zinc-600 dark:text-zinc-300 font-mono whitespace-nowrap">
                          {formatCurrency(p.costPrice, currency, currencySymbol)}
                        </td>

                        {/* Selling Price */}
                        <td className="px-2.5 py-2.5 text-right font-bold text-zinc-900 dark:text-white font-mono whitespace-nowrap">
                          {formatCurrency(p.sellingPrice, currency, currencySymbol)}
                        </td>

                        {/* Margin */}
                        <td className="px-2.5 py-2.5 text-right whitespace-nowrap">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                            +{formatCurrency(marginAmount, currency, currencySymbol)}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold ml-1">
                            ({marginPct}%)
                          </span>
                        </td>

                        {/* Stock Level */}
                        <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                          <StockBadge stockQuantity={p.stockQuantity} minThreshold={p.minThreshold} />
                        </td>

                        {/* Location */}
                        <td className="px-2.5 py-2.5 text-zinc-600 dark:text-zinc-300 text-[11px] whitespace-nowrap font-medium">
                          {p.shelfLocation || 'Aisle 1'}
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-2.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setRestockingProduct(p);
                              setIsRestockModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-none text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 transition font-bold text-[10px] uppercase tracking-wider"
                            title="Restock Inbound"
                          >
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none border border-zinc-200 dark:border-zinc-700 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(p._id, p.name)}
                            className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-none border border-zinc-200 dark:border-zinc-700 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSuccess={() => {
            setIsProductModalOpen(false);
            fetchProducts();
          }}
          initialProduct={editingProduct}
        />
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && restockingProduct && (
        <RestockModal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          onSuccess={() => {
            setIsRestockModalOpen(false);
            fetchProducts();
          }}
          product={restockingProduct}
        />
      )}

      {/* Bulk CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/70 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-none border-2 border-zinc-300 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-300 dark:border-blue-700">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Bulk Import Products (CSV)</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Upload a spreadsheet to batch create or update multiple items at once.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Sample Template Download Card */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 rounded-none flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-blue-950 dark:text-blue-200 block uppercase tracking-wider">Need a starting template?</span>
                  <span className="text-blue-800 dark:text-blue-300 text-[11px]">
                    Download our formatted CSV template with required columns and sample rows.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="px-3 py-1.5 rounded-none bg-white dark:bg-zinc-800 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 font-bold text-xs uppercase tracking-wider hover:bg-blue-50 dark:hover:bg-zinc-700 transition whitespace-nowrap"
                >
                  Download Template
                </button>
              </div>

              {/* Upload Input Area */}
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-none p-6 text-center transition bg-zinc-50 dark:bg-zinc-800/40">
                <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
                  {importFileName ? importFileName : 'Choose a .csv file to import'}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Supports Name, SKU, Category, Selling Price, Cost Price, Stock, Unit, Threshold
                </p>
                <label className="mt-3 inline-block cursor-pointer px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-none border border-blue-700 uppercase tracking-wider transition">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Errors */}
              {importError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-none flex items-center gap-2">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Success Summary */}
              {importSummary && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-none space-y-1">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{importSummary.message}</span>
                  </div>
                  {importSummary.errors?.length > 0 && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 pl-6">
                      <span className="font-semibold">Notices:</span>
                      <ul className="list-disc list-inside">
                        {importSummary.errors.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && !importSummary && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Previewing {parsedRows.length} items from CSV:
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      Showing first 4 rows
                    </span>
                  </div>
                  <div className="border-2 border-zinc-300 dark:border-zinc-700 rounded-none overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold border-b border-zinc-300 dark:border-zinc-700 uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-2 py-2">SKU</th>
                          <th className="px-2 py-2">Category</th>
                          <th className="px-2 py-2 text-right">SP</th>
                          <th className="px-2 py-2 text-right">CP</th>
                          <th className="px-2 py-2 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                        {parsedRows.slice(0, 4).map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                            <td className="px-3 py-1.5 font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                              {row.name}
                            </td>
                            <td className="px-2 py-1.5 text-zinc-500 font-mono">
                              {row.sku || 'Auto'}
                            </td>
                            <td className="px-2 py-1.5 text-zinc-600 dark:text-zinc-300">
                              {row.category}
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono font-bold text-zinc-900 dark:text-white">
                              {row.sellingPrice}
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono text-zinc-500">
                              {row.costPrice}
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                              {row.stockQuantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-zinc-300 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/80">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-none uppercase tracking-wider transition border border-zinc-300 dark:border-zinc-700"
              >
                {importSummary ? 'Done' : 'Cancel'}
              </button>

              {parsedRows.length > 0 && !importSummary && (
                <button
                  type="button"
                  disabled={importLoading}
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-none border border-blue-700 uppercase tracking-wider transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {importLoading
                      ? 'Importing...'
                      : `Confirm & Import (${parsedRows.length} Products)`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;