import React, { useState, useEffect } from 'react';
import { X, Package, Check, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
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

const UNITS = ['pcs', 'kg', 'gm', 'litres', 'ml', 'packet', 'box'];

const normalizeUnit = (u) => {
  if (!u) return 'pcs';
  const lower = String(u).trim().toLowerCase();
  if (lower === 'liter' || lower === 'litre' || lower === 'litres' || lower === 'ltr' || lower === 'l') {
    return 'litres';
  }
  return u;
};

const ProductModal = ({ isOpen, onClose, onSuccess, initialProduct = null }) => {
  const { currencySymbol } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Grocery & Staples',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    minThreshold: '5',
    unit: 'pcs',
    supplier: '',
    shelfLocation: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        sku: initialProduct.sku || '',
        category: initialProduct.category || 'Grocery & Staples',
        costPrice: initialProduct.costPrice ?? '',
        sellingPrice: initialProduct.sellingPrice ?? '',
        stockQuantity: initialProduct.stockQuantity ?? '',
        minThreshold: initialProduct.minThreshold ?? '5',
        unit: normalizeUnit(initialProduct.unit),
        supplier: initialProduct.supplier || '',
        shelfLocation: initialProduct.shelfLocation || '',
        description: initialProduct.description || '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'Grocery & Staples',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '',
        minThreshold: '5',
        unit: 'pcs',
        supplier: 'Wholesale Mandi',
        shelfLocation: 'Aisle 1',
        description: '',
      });
    }
    setError(null);
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || formData.costPrice === '' || formData.sellingPrice === '') {
      setError('Product Name, Cost Price, and Selling Price are required.');
      return;
    }

    try {
      setLoading(true);
      if (initialProduct?._id) {
        await api.patch(`/products/${initialProduct._id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product in inventory.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
              </h3>
              <p className="text-xs text-slate-500">Stock updates instantly sync with POS counter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amul Taaza Milk (1L), Parle-G Biscuit"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold shadow-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase shadow-sm transition"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium shadow-sm transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Selling Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium shadow-sm transition"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing: Cost Price vs. Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-100 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cost Price ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="Wholesale Purchase Cost"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-300 bg-white hover:border-slate-400 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm transition"
              />
              <span className="text-[10px] text-slate-500 font-medium">Wholesale cost from supplier</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selling Price ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="Retail Customer Price"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-300 bg-white hover:border-slate-400 text-emerald-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm transition"
              />
              <span className="text-[10px] text-slate-500 font-medium">
                Margin:{' '}
                {formData.sellingPrice && formData.costPrice
                  ? `₹${(parseFloat(formData.sellingPrice) - parseFloat(formData.costPrice)).toFixed(2)} / unit`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Quantities: Stock & Min Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current Stock Quantity
              </label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 25"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold shadow-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Safety Stock Threshold (Alert Level)
              </label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 5"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold shadow-sm transition"
              />
              <span className="text-[10px] text-slate-500 font-medium">Triggers Low Stock warning when reached</span>
            </div>
          </div>

          {/* Shelf Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shelf / Rack Location</label>
              <input
                type="text"
                placeholder="e.g. Aisle 2, Rack C"
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Name</label>
              <input
                type="text"
                placeholder="e.g. Metro Cash & Carry, ITC Ltd"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : initialProduct ? 'Update Product' : 'Add to Catalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
