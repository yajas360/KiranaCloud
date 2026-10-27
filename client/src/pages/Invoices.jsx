import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Ban,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ReceiptModal from '../components/pos/ReceiptModal';

const Invoices = () => {
  const { currency, currencySymbol } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('All');

  // Receipt Modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (paymentMethod !== 'All') params.append('paymentMethod', paymentMethod);
      params.append('limit', '50');

      const res = await api.get(`/sales?${params.toString()}`);
      if (res.data.success) {
        setSales(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load sales', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSales();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, paymentMethod]);

  const handleVoidSale = async (id, invoiceNumber) => {
    if (!window.confirm(`Are you sure you want to void invoice ${invoiceNumber}? This will restore all items back into store inventory.`)) {
      return;
    }

    try {
      await api.post(`/sales/${id}/void`);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to void invoice.');
    }
  };

  const handleViewReceipt = (sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Sales & Customer Invoices</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of completed counter checkouts, profit breakdown, and receipt reprints.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice Number, Customer Name, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="All">All Payment Modes</option>
            <option value="Cash">Cash Payments</option>
            <option value="UPI">UPI (GPay/PhonePe)</option>
            <option value="Card">Debit / Credit Card</option>
            <option value="Credit">Store Credit (Khata)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching billing records..." size="md" />
        ) : sales.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices found"
            description="Completed counter sales will appear here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5 text-center">Items</th>
                  <th className="px-4 py-3.5 text-right">Grand Total</th>
                  <th className="px-4 py-3.5 text-right font-bold text-emerald-700">Net Profit</th>
                  <th className="px-4 py-3.5 text-center">Payment</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      <span className="block font-semibold text-slate-700">{formatDate(sale.date, 'short')}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(sale.date, 'time')}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 block">{sale.customerName}</span>
                      {sale.customerPhone && (
                        <span className="text-[10px] text-slate-400">{sale.customerPhone}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600 font-semibold">
                      {sale.items.length} items
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm">
                      {formatCurrency(sale.grandTotal, currency, currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                      +{formatCurrency(sale.netProfit, currency, currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleViewReceipt(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition"
                        title="View / Print Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>

                      {sale.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleVoidSale(sale._id, sale.invoiceNumber)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Void / Cancel Sale"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {isReceiptOpen && selectedSale && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          saleData={selectedSale}
        />
      )}
    </div>
  );
};

export default Invoices;
