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

    const cp = parseFloat(formData.costPrice);
    const sp = parseFloat(formData.sellingPrice);

    if (isNaN(cp) || cp < 0) {
      setError('Cost price must be a non-negative number.');
      return;
    }

    if (isNaN(sp) || sp < 0) {
      setError('Selling price must be a non-negative number.');
      return;
    }

    if (sp < cp) {
      if (!window.confirm(`Warning: Selling Price (${currencySymbol}${sp}) is LESS than Cost Price (${currencySymbol}${cp}). This item will sell at a net loss. Proceed anyway?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        costPrice: cp,
        sellingPrice: sp,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        minThreshold: parseInt(formData.minThreshold, 10) || 5,
        unit: normalizeUnit(formData.unit),
      };

      if (initialProduct?._id) {
        await api.patch(`/products/${initialProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col max-h-[90vh] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-300 dark:border-blue-700">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                {initialProduct ? 'Edit Catalog Product' : 'Add New Inventory SKU'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Stock updates instantly sync with POS counter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-none bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amul Taaza Milk (1L), Parle-G Biscuit"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                SKU / Barcode
              </label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase transition"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition uppercase tracking-wider"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Selling Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition uppercase tracking-wider"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing: Cost Price vs. Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-none border-2 border-zinc-300 dark:border-zinc-700">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Cost Price ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="Wholesale Purchase Cost"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Wholesale cost from supplier</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Selling Price ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="Retail Customer Price"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
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
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Current Stock Quantity
              </label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 25"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Safety Stock Threshold (Alert Level)
              </label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 5"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold transition"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Triggers Low Stock warning when reached</span>
            </div>
          </div>

          {/* Shelf Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Shelf / Rack Location</label>
              <input
                type="text"
                placeholder="e.g. Aisle 2, Rack C"
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">Supplier Name</label>
              <input
                type="text"
                placeholder="e.g. Metro Cash & Carry, ITC Ltd"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none border-2 border-zinc-300 dark:border-zinc-700 uppercase tracking-wider transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-none border border-blue-700 uppercase tracking-wider transition disabled:opacity-50"
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