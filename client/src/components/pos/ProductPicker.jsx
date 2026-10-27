import React, { useState } from 'react';
import { Search, Plus, AlertCircle, Package } from 'lucide-react';
import { formatCurrency, getStockStatus } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ProductPicker = ({ products = [], cart = [], onAddToCart }) => {
  const { currency, currencySymbol } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Grocery & Staples',
    'Dairy & Bakery',
    'Beverages & Juices',
    'Snacks & Packaged Foods',
    'Personal Care',
    'Household & Cleaning',
    'Stationery & General',
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const getCartQuantity = (productId) => {
    const found = cart.find((item) => item.product._id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search and Category Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name or scan SKU / Barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
          />
        </div>

        {/* Category horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Package className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No matching products found</p>
            <p className="text-xs text-slate-400 mt-1">Try searching another keyword or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const inCartQty = getCartQuantity(p._id);
              const isOutOfStock = p.stockQuantity <= 0;
              const isMaxInCart = inCartQty >= p.stockQuantity;
              const { label, color, dotColor } = getStockStatus(p.stockQuantity, p.minThreshold);

              return (
                <button
                  key={p._id}
                  disabled={isOutOfStock || isMaxInCart}
                  onClick={() => onAddToCart(p)}
                  className={`p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all border shadow-sm relative group ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : isMaxInCart
                      ? 'bg-slate-50 border-amber-200 cursor-not-allowed'
                      : inCartQty > 0
                      ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500 active:scale-95'
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-95'
                  }`}
                >
                  {/* Cart quantity badge */}
                  {inCartQty > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                      {inCartQty}
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {p.sku}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5 leading-snug">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900 block">
                        {formatCurrency(p.sellingPrice, currency, currencySymbol)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                        isOutOfStock ? 'text-rose-600' : p.stockQuantity <= p.minThreshold ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {isOutOfStock ? 'Out of stock' : `${p.stockQuantity} ${p.unit} left`}
                      </span>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPicker;
