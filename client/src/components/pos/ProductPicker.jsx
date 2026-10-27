import React, { useState } from 'react';
import { Search, Plus, Minus, Package, Barcode } from 'lucide-react';
import { formatCurrency, getStockStatus, formatUnit } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

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
      if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

  const getCartQuantity = (productId) => {
    const found = cart.find((item) => item.product._id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="flex flex-col h-full space-y-2.5">
      {/* Search Bar & Fast Filters */}
      <div className="space-y-2 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Scan barcode, SKU, or search item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-medium shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-2 text-xs font-semibold rounded-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase tracking-wider shadow-sm"
            >
              <option value="default" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Sort: Default</option>
              <option value="price-asc" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Price: Low to High</option>
              <option value="price-desc" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Price: High to Low</option>
              <option value="name-asc" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Quick Category Chips Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-none whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <Package className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">No matching products</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Try searching another barcode, SKU, or name</p>
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
                  className={`p-3 rounded-none text-left flex flex-col justify-between transition-all border relative select-none shadow-sm ${
                    isOutOfStock
                      ? 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 opacity-60'
                      : isMaxInCart
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80'
                      : inCartQty > 0
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500/80 dark:border-blue-500'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-md'
                  }`}
                >
                  {/* Cart quantity tag */}
                  {inCartQty > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 min-w-[20px] h-5 rounded-none bg-blue-600 text-white text-[10px] font-mono font-bold flex items-center justify-center border border-blue-700 shadow-sm">
                      {inCartQty} in cart
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                        {p.sku}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight truncate max-w-[90px]">
                        {p.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-mono font-black text-zinc-900 dark:text-white block leading-none">
                        {formatCurrency(p.sellingPrice, currency, currencySymbol)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium mt-1 whitespace-nowrap ${
                          isOutOfStock
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : isMaxInCart
                            ? 'text-amber-800 dark:text-amber-400 font-bold'
                            : availableLeft <= p.minThreshold
                            ? 'text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            isOutOfStock ? 'bg-rose-500' : isMaxInCart ? 'bg-amber-500' : dotColor
                          }`}
                        />
                        <span className="truncate">
                          {isOutOfStock
                            ? 'Out of stock'
                            : isMaxInCart
                            ? 'Max added'
                            : `${availableLeft} ${formatUnit(p.unit)} left`}
                        </span>
                      </span>
                    </div>

                    {/* Stepper or Add button */}
                    {inCartQty > 0 ? (
                      <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-800 border border-blue-500 dark:border-blue-600 rounded-none p-0.5 flex-shrink-0 shadow-sm">
                        <button
                          type="button"
                          onClick={() => onSubtractFromCart && onSubtractFromCart(p._id)}
                          className="w-5 h-5 rounded-none bg-zinc-100 dark:bg-zinc-700 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-zinc-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-300 flex items-center justify-center transition active:translate-y-[1px]"
                          title="Subtract 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center text-[11px] font-mono font-black text-zinc-900 dark:text-white">
                          {inCartQty}
                        </span>
                        <button
                          type="button"
                          disabled={availableLeft <= 0}
                          onClick={() => onAddToCart(p)}
                          className="w-5 h-5 rounded-none bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-[1px]"
                          title={availableLeft <= 0 ? 'No more available' : 'Add 1 more'}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => onAddToCart(p)}
                        className="px-2.5 py-1 text-xs font-bold rounded-none bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider active:translate-y-[1px] flex-shrink-0 shadow-sm"
                      >
                        Add
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
