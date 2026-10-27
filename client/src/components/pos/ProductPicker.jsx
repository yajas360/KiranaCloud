import React, { useState } from 'react';
import { Search, Plus, Minus, Package } from 'lucide-react';
import { formatCurrency, getStockStatus } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ProductPicker = ({
  products = [],
  cart = [],
  onAddToCart,
  onSubtractFromCart,
}) => {
  const { currency, currencySymbol } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const categories = [
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

  const filteredProducts = products
    .filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch =
        searchTerm.trim() === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a.sellingPrice - b.sellingPrice;
      }
      if (sortBy === 'price-desc') {
        return b.sellingPrice - a.sellingPrice;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0; // default order
    });

  const getCartQuantity = (productId) => {
    const found = cart.find((item) => item.product._id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search, Category Dropdown, and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Scan barcode, SKU, or search item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-medium"
          />
        </div>

        {/* Category Dropdown (default All) */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              Category: {cat}
            </option>
          ))}
        </select>

        {/* Sort by Price & Name Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
        >
          <option value="default">Sort: Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
        </select>
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
              const availableLeft = Math.max(0, p.stockQuantity - inCartQty);
              const isMaxInCart = availableLeft === 0 && !isOutOfStock;
              const { dotColor } = getStockStatus(p.stockQuantity, p.minThreshold);

              return (
                <div
                  key={p._id}
                  className={`p-3 rounded-xl text-left flex flex-col justify-between transition border shadow-xs relative select-none ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : isMaxInCart
                      ? 'bg-amber-50/40 border-amber-300'
                      : inCartQty > 0
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Cart quantity badge */}
                  {inCartQty > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 min-w-[20px] h-5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow">
                      {inCartQty} in cart
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

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-mono font-black text-slate-900 block leading-none">
                        {formatCurrency(p.sellingPrice, currency, currencySymbol)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-1 whitespace-nowrap ${
                        isOutOfStock
                          ? 'text-rose-600'
                          : isMaxInCart
                          ? 'text-amber-800 font-bold'
                          : availableLeft <= p.minThreshold
                          ? 'text-amber-600 font-bold'
                          : 'text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isOutOfStock ? 'bg-rose-500' : isMaxInCart ? 'bg-amber-500' : dotColor
                        }`} />
                        <span className="truncate">
                          {isOutOfStock
                            ? '0 left (Out of stock)'
                            : isMaxInCart
                            ? '0 left (Max added)'
                            : `${availableLeft} ${p.unit} left`}
                        </span>
                      </span>
                    </div>

                    {/* Stepper or Add button */}
                    {inCartQty > 0 ? (
                      <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onSubtractFromCart && onSubtractFromCart(p._id)}
                          className="w-6 h-6 rounded bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center transition border border-slate-200 active:scale-95"
                          title="Subtract 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-[11px] font-mono font-bold text-slate-900">
                          {inCartQty}
                        </span>
                        <button
                          type="button"
                          disabled={availableLeft <= 0}
                          onClick={() => onAddToCart(p)}
                          className="w-6 h-6 rounded bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white flex items-center justify-center transition border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                          title={availableLeft <= 0 ? 'No more available' : 'Add 1 more'}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          if (!isOutOfStock) onAddToCart(p);
                        }}
                        className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                        title={isOutOfStock ? 'Out of stock' : 'Add to Bill'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPicker;
