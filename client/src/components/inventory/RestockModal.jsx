import React, { useState } from 'react';
import { X, ArrowDownCircle, Check, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const RestockModal = ({ isOpen, onClose, onSuccess, product }) => {
  const { currency, currencySymbol } = useAuth();
  const [additionalStock, setAdditionalStock] = useState('10');
  const [newCostPrice, setNewCostPrice] = useState(product?.costPrice?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity || 0;
  const numAdd = parseInt(additionalStock, 10) || 0;
  const projectedStock = currentStock + numAdd;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (numAdd <= 0) {
      setError('Please enter a positive restock quantity.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/products/${product._id}/restock`, {
        additionalStock: numAdd,
        newCostPrice: newCostPrice ? parseFloat(newCostPrice) : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restock product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Restock Product Inbound</h3>
              <p className="text-xs text-slate-500">Add incoming stock from supplier delivery</p>
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
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product details preview */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {product.sku} • {product.category}
            </span>
            <h4 className="text-sm font-bold text-slate-800 mt-0.5">{product.name}</h4>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-500">Current Stock:</span>
              <span className="font-bold text-slate-800">
                {currentStock} {product.unit}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Quantity Received ({product.unit}) *
              </label>
              <input
                type="number"
                step="1"
                required
                min="1"
                placeholder="e.g. 20"
                value={additionalStock}
                onChange={(e) => setAdditionalStock(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                New resulting inventory: {projectedStock} {product.unit}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Wholesale Cost Price ({currencySymbol}) (Optional update)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder={product.costPrice?.toString()}
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Update if supplier charged a different batch rate.
              </span>
            </div>

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
                <span>{loading ? 'Restocking...' : `Add +${numAdd} Units`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestockModal;
