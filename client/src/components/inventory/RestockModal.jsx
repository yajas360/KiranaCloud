import React, { useState, useEffect } from 'react';
import { X, ArrowDownCircle, Check, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const RestockModal = ({ isOpen, onClose, onSuccess, product }) => {
  const { currency, currencySymbol } = useAuth();
  const [additionalStock, setAdditionalStock] = useState('10');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setNewCostPrice(product.costPrice !== undefined ? product.costPrice.toString() : '');
      setNewSellingPrice(product.sellingPrice !== undefined ? product.sellingPrice.toString() : '');
      setAdditionalStock('10');
      setError(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity || 0;
  const numAdd = parseInt(additionalStock, 10) || 0;
  const projectedStock = currentStock + numAdd;

  const effCost = newCostPrice !== '' ? parseFloat(newCostPrice) : product.costPrice;
  const effSell = newSellingPrice !== '' ? parseFloat(newSellingPrice) : product.sellingPrice;
  const newMargin = !isNaN(effCost) && !isNaN(effSell) ? effSell - effCost : 0;
  const newMarginPct = effSell > 0 ? Math.round((newMargin / effSell) * 100) : 0;

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
        newCostPrice: newCostPrice !== '' ? parseFloat(newCostPrice) : undefined,
        newSellingPrice: newSellingPrice !== '' ? parseFloat(newSellingPrice) : undefined,
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
              <h3 className="text-base font-bold text-slate-900">Restock Product & Update Pricing</h3>
              <p className="text-xs text-slate-500">Record incoming stock and adjust wholesale / retail rates</p>
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
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
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
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-mono"
              />
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                New resulting inventory: {projectedStock} {product.unit}
              </span>
            </div>

            {/* Price Updates: Cost Price & Selling Price */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Batch Pricing Updates (Optional)
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cost Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder={product.costPrice?.toString()}
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Wholesale rate</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Selling Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder={product.sellingPrice?.toString()}
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold font-mono text-emerald-700"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Retail / MRP</span>
                </div>
              </div>

              {/* Dynamic Margin Indicator */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Projected Margin:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  +{formatCurrency(newMargin, currency, currencySymbol)} ({newMarginPct}%)
                </span>
              </div>
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
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Updating...' : `Restock & Update Rates`}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestockModal;
