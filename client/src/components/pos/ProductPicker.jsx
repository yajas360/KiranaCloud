import React, { useState } from 'react';
import { Search, Plus, Package } from 'lucide-react';
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
    <div className="flex flex-col h-full space-y-3">
      {/* Search and Category Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Scan barcode, SKU, or search item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        {/* Category horizontal scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
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
            <Package className="w-8 h-8 text-slate-300 mb-1.5" />
            <p className="text-xs font-bold text-slate-600">No matching products</p>
            <p className="text-[11px] text-slate-400">Try searching another term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((p) => {
              const inCartQty = getCartQuantity(p._id);
              const isOutOfStock = p.stockQuantity <= 0;
              const isMaxInCart = inCartQty >= p.stockQuantity;
              const { dotColor } = getStockStatus(p.stockQuantity, p.minThreshold);

              return (
                <button
                  key={p._id}
                  disabled={isOutOfStock || isMaxInCart}
                  onClick={() => onAddToCart(p)}
                  className={`p-3 rounded-xl text-left flex flex-col justify-between transition border shadow-xs relative ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : isMaxInCart
                      ? 'bg-amber-50/50 border-amber-200 cursor-not-allowed'
                      : inCartQty > 0
                      ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {/* Cart quantity badge */}
                  {inCartQty > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow">
                      {inCartQty}
                    </span>
                  )}

                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      {p.sku}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-mono font-black text-slate-900 block leading-none">
                        {formatCurrency(p.sellingPrice, currency, currencySymbol)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-1 ${
                        isOutOfStock ? 'text-rose-600' : p.stockQuantity <= p.minThreshold ? 'text-amber-700' : 'text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {isOutOfStock ? 'Out of stock' : `${p.stockQuantity} ${p.unit}`}
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition">
                      <Plus className="w-3.5 h-3.5" />
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
