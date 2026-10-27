import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  PackageCheck,
  ArrowDownCircle,
  Truck,
  ArrowLeft,
} from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, getCategoryColor, formatUnit } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RestockModal from '../components/inventory/RestockModal';

const ReorderSheet = () => {
  const { currency, currencySymbol, storeName } = useAuth();
  const [reorderData, setReorderData] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchReorderSheet = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/reorder-sheet');
      if (res.data.success) {
        setReorderData(res.data.data);
        setTotalBudget(res.data.totalEstimatedRestockBudget);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/inventory" className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Supplier Reorder Purchase Sheet
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-6">
            Auto-compiled purchase requisition for products currently below safety stock thresholds.
          </p>
        </div>
      </div>

      {/* Reorder Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Items to Reorder
            </span>
            <p className="text-2xl font-black text-amber-600 mt-1">{reorderData.length} SKUs</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Est. Wholesale Budget
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(totalBudget, currency, currencySymbol)}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Store Buffer Health
            </span>
            <p className="text-xs text-emerald-800 font-semibold mt-1">
              {reorderData.length === 0
                ? 'All products are safely stocked.'
                : 'Restocking these items prevents lost counter sales.'}
            </p>
          </div>
          <PackageCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
        </div>
      </div>

      {/* Printable Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Generating purchase order calculations..." size="md" />
        ) : reorderData.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <PackageCheck className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Inventory Perfectly Stocked</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              None of your catalog products are below their safety alert thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Item & SKU</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Category</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Current Stock</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Safety Threshold</th>
                  <th className="px-4 py-3.5 text-center font-bold text-emerald-700 whitespace-nowrap">
                    Suggested Order Qty
                  </th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Cost Price / Unit</th>
                  <th className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                    Estimated Cost
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Supplier</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reorderData.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.currentStock === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.currentStock} {formatUnit(item.unit)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-500 font-semibold">
                      {item.minThreshold} {formatUnit(item.unit)}
                    </td>
                    <td className="px-4 py-3.5 text-center font-black text-emerald-700 text-sm">
                      +{item.suggestedOrderQty} {formatUnit(item.unit)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600">
                      {formatCurrency(item.costPrice, currency, currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(item.estimatedCost, currency, currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-semibold">
                      {item.supplier || 'Wholesale Mandi'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
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
                        className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                      >
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
