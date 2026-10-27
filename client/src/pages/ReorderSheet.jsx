import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  PackageCheck,
  ArrowDownCircle,
  Truck,
  ArrowLeft,
  Search,
  Download,
} from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatUnit } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RestockModal from '../components/inventory/RestockModal';

const ReorderSheet = () => {
  const { currency, currencySymbol } = useAuth();
  const [reorderData, setReorderData] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('stock-asc');

  // Modal
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchReorderSheet = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/reorder-sheet');
      if (res.data.success) {
        setReorderData(res.data.data || []);
        setTotalBudget(res.data.totalEstimatedRestockBudget || 0);
      }
    } catch (err) {
      console.error('Failed to load reorder sheet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReorderSheet();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(reorderData.map((item) => item.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [reorderData]);

  const filteredItems = useMemo(() => {
    return reorderData
      .filter((item) => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !search ||
          item.name.toLowerCase().includes(search) ||
          item.sku.toLowerCase().includes(search) ||
          (item.supplier && item.supplier.toLowerCase().includes(search));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'stock-asc') return a.currentStock - b.currentStock;
        if (sortBy === 'order-desc') return b.suggestedOrderQty - a.suggestedOrderQty;
        if (sortBy === 'budget-desc') return b.estimatedCost - a.estimatedCost;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [reorderData, selectedCategory, searchTerm, sortBy]);

  const handleExportCSV = () => {
    if (reorderData.length === 0) return;
    const headers = ['Product Name', 'SKU', 'Category', 'Current Stock', 'Safety Threshold', 'Suggested Order Qty', 'Unit', 'Cost Price', 'Estimated Budget', 'Supplier'];
    const rows = reorderData.map((item) => [
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.sku || ''}"`,
      `"${item.category || ''}"`,
      item.currentStock,
      item.minThreshold,
      item.suggestedOrderQty,
      `"${formatUnit(item.unit)}"`,
      item.costPrice,
      item.estimatedCost,
      `"${(item.supplier || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KiranaCloud_Reorder_Sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-zinc-300 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/inventory"
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none border border-zinc-300 dark:border-zinc-700 transition"
              title="Back to Inventory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">
              Supplier Reorder Sheet
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-none bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 uppercase">
              {reorderData.length} SKUs Alert
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-7">
            Automated wholesale purchase requisition for inventory items currently below safety buffer thresholds.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={reorderData.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none transition uppercase tracking-wider disabled:opacity-50 shadow-sm active:translate-y-[1px]"
            title="Download CSV for wholesale mandi order"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Export Order CSV</span>
          </button>

          <Link
            to="/inventory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:translate-y-[1px] rounded-none border border-blue-700 uppercase tracking-wider transition shadow-sm"
          >
            <span>Back to Inventory</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Items Needing Reorder
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {reorderData.length} <span className="text-xs font-semibold text-zinc-400">SKUs</span>
            </p>
          </div>
          <div className="p-2.5 rounded-none bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Estimated Wholesale Budget
            </span>
            <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1 font-mono">
              {formatCurrency(totalBudget, currency, currencySymbol)}
            </p>
          </div>
          <div className="p-2.5 rounded-none bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-none bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Store Buffer Health
            </span>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 font-semibold mt-1">
              {reorderData.length === 0
                ? 'All catalog items are comfortably stocked.'
                : 'Restocking suggested quantities prevents stockouts and lost counter bills.'}
            </p>
          </div>
          <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-none border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase tracking-wider"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase tracking-wider"
          >
            <option value="stock-asc" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Stock: Lowest First</option>
            <option value="order-desc" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Order Qty: Highest First</option>
            <option value="budget-desc" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Budget: Highest First</option>
            <option value="name-asc" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Reorder Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSpinner text="Generating purchase order calculations..." size="md" />
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <PackageCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
              {reorderData.length === 0 ? 'Inventory Perfectly Stocked' : 'No matching items'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {reorderData.length === 0
                ? 'None of your catalog products are below their safety alert thresholds.'
                : 'Try adjusting your search query or category filter.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-bold border-b-2 border-zinc-300 dark:border-zinc-700">
              <tr>
                <th className="px-3.5 py-3 text-left">Product & Supplier</th>
                <th className="px-2.5 py-3 text-center">Stock</th>
                <th className="px-2.5 py-3 text-center hidden md:table-cell">Buffer</th>
                <th className="px-2.5 py-3 text-center">Order Qty</th>
                <th className="px-2.5 py-3 text-right">Est. Cost</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
              {filteredItems.map((item) => {
                const isOutOfStock = item.currentStock === 0;
                return (
                  <tr key={item._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition">
                    {/* Product & Supplier info */}
                    <td className="px-3.5 py-2.5 min-w-0 max-w-[240px]">
                      <span className="font-bold text-zinc-900 dark:text-white block text-xs truncate" title={item.name}>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 truncate">
                        <span>{item.sku}</span>
                        <span>•</span>
                        <span className="truncate">{item.category}</span>
                        {item.supplier && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-500 dark:text-zinc-400 truncate">{item.supplier}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold border whitespace-nowrap uppercase tracking-wider ${
                          isOutOfStock
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-none ${isOutOfStock ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <span>{item.currentStock} {formatUnit(item.unit)}</span>
                      </span>
                    </td>

                    {/* Safety Buffer Threshold */}
                    <td className="px-2.5 py-2.5 text-center text-zinc-500 dark:text-zinc-400 font-mono text-[11px] whitespace-nowrap hidden md:table-cell">
                      {item.minThreshold} {formatUnit(item.unit)}
                    </td>

                    {/* Suggested Order Qty */}
                    <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-black font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 uppercase">
                        +{item.suggestedOrderQty} {formatUnit(item.unit)}
                      </span>
                    </td>

                    {/* Estimated Cost */}
                    <td className="px-2.5 py-2.5 text-right whitespace-nowrap font-mono">
                      <span className="font-bold text-zinc-900 dark:text-white block text-xs">
                        {formatCurrency(item.estimatedCost, currency, currencySymbol)}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                        @{formatCurrency(item.costPrice, currency, currencySymbol)}/{formatUnit(item.unit)}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedProduct({
                            _id: item._id,
                            name: item.name,
                            sku: item.sku,
                            category: item.category,
                            stockQuantity: item.currentStock,
                            unit: item.unit,
                            costPrice: item.costPrice,
                            sellingPrice: item.sellingPrice,
                          });
                          setIsRestockModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 transition font-bold text-[10px] uppercase tracking-wider"
                        title="Restock Inbound Inventory"
                      >
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Restock Modal */}
      {isRestockModalOpen && selectedProduct && (
        <RestockModal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          onSuccess={() => {
            setIsRestockModalOpen(false);
            fetchReorderSheet();
          }}
          product={selectedProduct}
        />
      )}
    </div>
  );
};

export default ReorderSheet;