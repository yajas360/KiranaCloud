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
  RefreshCw,
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

  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= p.minThreshold && p.stockQuantity > 0
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

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

      parsed.push({
        name,
        sku: row.sku || row.barcode || values[1] || '',
        category: row.category || values[2] || 'Other',
        sellingPrice: parseFloat(row.sellingprice || row.sp || values[3]) || 0,
        costPrice: parseFloat(row.costprice || row.cp || values[4]) || 0,
        stockQuantity: parseInt(row.stockquantity || row.stock || row.qty || values[5], 10) || 0,
        unit: row.unit || values[6] || 'pcs',
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
      link.setAttribute('download', `storepulse_inventory_${new Date().toISOString().split('T')[0]}.csv`);
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
    a.download = 'storepulse_products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Inventory & Stock Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage wholesale costs, retail pricing, stock availability, and safety thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-2xs"
            title="Export all products to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-2xs"
            title="Bulk import products from CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          <Link
            to="/reorder-sheet"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition shadow-2xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Reorder</span>
            {lowStockCount + outOfStockCount > 0 && ` (${lowStockCount + outOfStockCount})`}
          </Link>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="LOW_STOCK">⚠️ Low Stock Only</option>
            <option value="OUT_OF_STOCK">🚫 Out of Stock Only</option>
            <option value="IN_STOCK">✅ Healthy Stock Only</option>
          </select>

          {/* Sort By Price Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="stock-asc">Stock: Low to High</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
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
              <tbody className="divide-y divide-slate-100 font-medium">
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
                    <tr key={p._id} className="hover:bg-slate-50/60 transition">
                      {/* Name & SKU */}
                      <td className="px-3 py-2.5 whitespace-nowrap min-w-0 max-w-[210px]">
                        <span className="font-bold text-slate-900 block text-xs truncate" title={p.name}>
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-400 block truncate">
                          {p.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${getCategoryColor(p.category)}`}>
                          {p.category}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="px-2.5 py-2.5 text-right text-slate-600 font-mono whitespace-nowrap">
                        {formatCurrency(p.costPrice, currency, currencySymbol)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-2.5 py-2.5 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                        {formatCurrency(p.sellingPrice, currency, currencySymbol)}
                      </td>

                      {/* Margin */}
                      <td className="px-2.5 py-2.5 text-right whitespace-nowrap">
                        <span className="text-emerald-700 font-bold font-mono">
                          +{formatCurrency(marginAmount, currency, currencySymbol)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold ml-1">
                          ({marginPct}%)
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                        <StockBadge stockQuantity={p.stockQuantity} minThreshold={p.minThreshold} />
                      </td>

                      {/* Location */}
                      <td className="px-2.5 py-2.5 text-slate-600 text-[11px] whitespace-nowrap font-medium">
                        {p.shelfLocation || 'Aisle 1'}
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-2.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setRestockingProduct(p);
                            setIsRestockModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition font-bold text-[11px]"
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
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Import Products (CSV)</h3>
                  <p className="text-xs text-slate-500">
                    Upload a spreadsheet to batch create or update multiple items at once.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Sample Template Download Card */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-emerald-950 block">Need a starting template?</span>
                  <span className="text-emerald-800 text-[11px]">
                    Download our formatted CSV template with required columns and sample rows.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition shadow-2xs whitespace-nowrap"
                >
                  Download Template
                </button>
              </div>

              {/* Upload Input Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center transition bg-slate-50/40">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {importFileName ? importFileName : 'Choose a .csv file to import'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports Name, SKU, Category, Selling Price, Cost Price, Stock, Unit, Threshold
                </p>
                <label className="mt-3 inline-block cursor-pointer px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition">
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
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Import Success Summary */}
              {importSummary && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{importSummary.message}</span>
                  </div>
                  {importSummary.errors?.length > 0 && (
                    <div className="text-[11px] text-amber-800 mt-1 pl-6">
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
                    <span className="font-bold text-slate-700">
                      Previewing {parsedRows.length} items from CSV:
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Showing first 4 rows
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-2 py-2">SKU</th>
                          <th className="px-2 py-2">Category</th>
                          <th className="px-2 py-2 text-right">SP</th>
                          <th className="px-2 py-2 text-right">CP</th>
                          <th className="px-2 py-2 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {parsedRows.slice(0, 4).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5 font-bold text-slate-800 truncate max-w-[150px]">
                              {row.name}
                            </td>
                            <td className="px-2 py-1.5 text-slate-500 font-mono">
                              {row.sku || 'Auto'}
                            </td>
                            <td className="px-2 py-1.5 text-slate-600">
                              {row.category}
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-900">
                              {row.sellingPrice}
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono text-slate-500">
                              {row.costPrice}
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono text-emerald-700 font-bold">
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
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                {importSummary ? 'Done' : 'Cancel'}
              </button>

              {parsedRows.length > 0 && !importSummary && (
                <button
                  type="button"
                  disabled={importLoading}
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm transition disabled:opacity-50"
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
