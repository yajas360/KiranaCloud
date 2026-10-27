import React, { useState, useEffect } from 'react';
import { X, ArrowDownCircle, Check, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency, formatUnit } from '../../utils/formatters';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-none bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Restock Product & Pricing</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Record incoming stock and adjust wholesale / retail rates</p>
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
          <div className="mx-6 mt-4 p-3 rounded-none bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product details preview */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-none bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
              {product.sku} • {product.category}
            </span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{product.name}</h4>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">Current Stock:</span>
              <span className="font-bold text-zinc-900 dark:text-white font-mono">
                {currentStock} {formatUnit(product.unit)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                Additional Quantity Received ({formatUnit(product.unit)}) *
              </label>
              <input
                type="number"
                step="1"
                required
                min="1"
                placeholder="e.g. 20"
                value={additionalStock}
                onChange={(e) => setAdditionalStock(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono transition"
              />
              <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold block mt-1 font-mono">
                New resulting inventory: {projectedStock} {formatUnit(product.unit)}
              </span>
            </div>

            {/* Price Updates: Cost Price & Selling Price */}
            <div className="p-3.5 rounded-none bg-zinc-100 dark:bg-zinc-800/60 border-2 border-zinc-300 dark:border-zinc-700 space-y-2.5">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Batch Pricing Updates (Optional)
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    Cost Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder={product.costPrice?.toString()}
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono transition"
                  />
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block mt-0.5">Wholesale rate</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    Selling Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder={product.sellingPrice?.toString()}
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono transition"
                  />
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block mt-0.5">Retail / MRP</span>
                </div>
              </div>

              {/* Dynamic Margin Indicator */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Projected Margin:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  +{formatCurrency(newMargin, currency, currencySymbol)} ({newMarginPct}%)
                </span>
              </div>
            </div>

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
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-none border border-blue-700 uppercase tracking-wider transition disabled:opacity-50"
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