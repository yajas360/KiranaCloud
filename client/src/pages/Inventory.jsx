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

        <div className="flex items-center gap-2.5">
          <Link
            to="/reorder-sheet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Reorder Sheet {lowStockCount + outOfStockCount > 0 && `(${lowStockCount + outOfStockCount})`}</span>
          </Link>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition"
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
    </div>
  );
};

export default Inventory;
