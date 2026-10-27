import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Ban,
  Calculator,
} from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ReceiptModal from '../components/pos/ReceiptModal';
import DayCloseModal from '../components/analytics/DayCloseModal';

const Invoices = () => {
  const { currency, currencySymbol } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('All');

  // Day Close Modal
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Sales & Customer Invoices</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Audit trail of completed counter checkouts, profit breakdown, and receipt reprints.
          </p>
        </div>

        <button
          onClick={() => setIsDayCloseOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none transition self-start sm:self-auto uppercase tracking-wider shadow-sm active:translate-y-[1px]"
          title="End of day register balancing and Z-Report"
        >
          <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Day-Close Register</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-none border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-2.5 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by Invoice Number, Customer Name, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-none border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 w-full sm:w-auto uppercase tracking-wider"
          >
            <option value="All" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">All Payment Modes</option>
            <option value="Cash" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Cash Payments</option>
            <option value="UPI" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">UPI (GPay/PhonePe)</option>
            <option value="Card" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Debit / Credit Card</option>
            <option value="Credit" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">Store Credit (Khata)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
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
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-bold border-b-2 border-zinc-300 dark:border-zinc-700">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-3 py-3">Date & Time</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3 text-center">Items</th>
                  <th className="px-3 py-3 text-right">Grand Total</th>
                  <th className="px-3 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">Net Profit</th>
                  <th className="px-3 py-3 text-center">Payment</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition">
                    <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white font-mono">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400">
                      <span className="block font-semibold text-zinc-700 dark:text-zinc-200">{formatDate(sale.date, 'short')}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{formatDate(sale.date, 'time')}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{sale.customerName}</span>
                      {sale.customerPhone && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{sale.customerPhone}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-zinc-600 dark:text-zinc-300 font-semibold">
                      {sale.items.length} items
                    </td>
                    <td className="px-3 py-2.5 text-right font-black text-zinc-900 dark:text-white font-mono text-sm">
                      {formatCurrency(sale.grandTotal, currency, currencySymbol)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      +{formatCurrency(sale.netProfit, currency, currencySymbol)}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 uppercase whitespace-nowrap font-mono">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase whitespace-nowrap border ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleViewReceipt(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold text-[10px] uppercase tracking-wider border border-blue-300 dark:border-blue-700 transition"
                        title="View / Print Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>

                      {sale.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleVoidSale(sale._id, sale.invoiceNumber)}
                          className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-none border border-zinc-200 dark:border-zinc-700 transition"
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

      {/* Day Close / Z-Report Modal */}
      <DayCloseModal
        isOpen={isDayCloseOpen}
        onClose={() => setIsDayCloseOpen(false)}
        onClosedSuccess={() => fetchSales()}
      />
    </div>
  );
};

export default Invoices;