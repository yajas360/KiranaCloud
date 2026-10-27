import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowDownRight,
  History,
  Phone,
  Check,
  AlertCircle,
  X,
  CreditCard,
  Trash2,
  MessageSquare,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const CustomersKhata = () => {
  const { currency, currencySymbol, storeName } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [totalCredit, setTotalCredit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Settlement Modal
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('Cash payment');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Customer Ledger History Modal
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState(null);

  // New Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('5000');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers${searchTerm ? `?search=${searchTerm}` : ''}`);
      if (res.data.success) {
        setCustomers(res.data.data);
        setTotalCredit(res.data.totalOutstandingCredit || 0);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError(null);

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }

    try {
      setPaymentLoading(true);
      await api.post(`/customers/${payingCustomer._id}/payment`, {
        amount: amt,
        notes: paymentNotes,
      });
      setPayingCustomer(null);
      setPaymentAmount('');
      fetchCustomers();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAddError(null);

    if (!newCustName.trim() || !newCustPhone.trim()) {
      setAddError('Customer Name and Phone Number are required.');
      return;
    }

    try {
      setAddLoading(true);
      await api.post('/customers', {
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        creditLimit: parseFloat(newCustLimit) || 5000,
      });
      setIsAddCustomerOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      fetchCustomers();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to register customer.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from your Khata ledger?`)) {
      return;
    }
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  const sendWhatsAppReminder = (customer) => {
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hello ${customer.name}, this is a gentle reminder from ${storeName || 'our store'} regarding your outstanding store credit balance of ${currencySymbol}${customer.balance.toFixed(2)}. Kindly clear your dues via cash or UPI at your earliest convenience. Thank you!`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Khata (Credit Ledger)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer store credit, outstanding dues, and cash/UPI payment settlements.
          </p>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Khata Customer</span>
        </button>
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Outstanding Khata Debt
            </span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {formatCurrency(totalCredit, currency, currencySymbol)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total credit owed by customers to your store</p>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Khata Accounts
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{customers.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Registered credit ledger customers</p>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading customer credit ledgers..." size="md" />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Khata customers registered"
            description="Customers who buy on store credit will appear here."
            actionLabel="Register Customer"
            onAction={() => setIsAddCustomerOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5 text-right font-bold text-rose-600">
                    Outstanding Debt
                  </th>
                  <th className="px-4 py-3.5 text-right text-slate-500">Credit Limit</th>
                  <th className="px-4 py-3.5 text-center">Transactions</th>
                  <th className="px-5 py-3.5 text-right">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono">
                      {c.phone}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-rose-600 text-sm">
                      {formatCurrency(c.balance, currency, currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500">
                      {formatCurrency(c.creditLimit, currency, currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLedgerCustomer(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition"
                        title="Click to view full transaction ledger"
                      >
                        <History className="w-3 h-3 text-slate-500" />
                        <span>{c.history?.length || 0} entries</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {c.balance > 0 && (
                        <button
                          onClick={() => sendWhatsAppReminder(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-600 text-green-700 hover:text-white font-bold text-[11px] border border-green-200 transition shadow-2xs"
                          title="Send WhatsApp payment reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Remind</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setPayingCustomer(c);
                          setPaymentAmount(c.balance > 0 ? c.balance.toString() : '');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition shadow-2xs"
                        title="Record Cash/UPI settlement"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCustomer(c._id, c.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Khata Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Settlement Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Credit Payment</h3>
                <p className="text-xs text-slate-500">{payingCustomer.name} • {payingCustomer.phone}</p>
              </div>
              <button
                onClick={() => setPayingCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Current Debt Owed:</span>
                <span className="font-bold text-rose-600 text-sm">
                  {formatCurrency(payingCustomer.balance, currency, currencySymbol)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount Received ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {payingCustomer.balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(payingCustomer.balance.toString())}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-700 border border-slate-200 transition"
                    >
                      Full ({formatCurrency(payingCustomer.balance, currency, currencySymbol)})
                    </button>
                  )}
                  {payingCustomer.balance > 1 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(Math.round(payingCustomer.balance / 2).toString())}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-700 border border-slate-200 transition"
                    >
                      50% ({formatCurrency(Math.round(payingCustomer.balance / 2), currency, currencySymbol)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('500')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-700 border border-slate-200 transition"
                  >
                    {currencySymbol}500
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('1000')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 hover:text-emerald-700 border border-slate-200 transition"
                  >
                    {currencySymbol}1,000
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes / Mode</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in Cash, GPay UPI reference #1234"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{paymentLoading ? 'Saving...' : 'Record Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger History Modal */}
      {selectedLedgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedLedgerCustomer.name} - Khata Ledger
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Phone: {selectedLedgerCustomer.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedLedgerCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balances summary */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border-b border-slate-100">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Balance Owed</span>
                <span className="text-base font-black text-rose-600">
                  {formatCurrency(selectedLedgerCustomer.balance, currency, currencySymbol)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Credit Limit Ceiling</span>
                <span className="text-base font-black text-slate-700">
                  {formatCurrency(selectedLedgerCustomer.creditLimit, currency, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Chronological Entries */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              {(!selectedLedgerCustomer.history || selectedLedgerCustomer.history.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">No transactions recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Credit purchases and payment settlements will appear here.
                  </p>
                </div>
              ) : (
                [...selectedLedgerCustomer.history].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                      entry.type === 'PURCHASE'
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-emerald-50/40 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          entry.type === 'PURCHASE'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {entry.type === 'PURCHASE' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {entry.type === 'PURCHASE' ? 'Store Credit Purchase' : 'Payment Received'}
                          </span>
                          {entry.invoiceNumber && (
                            <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-mono text-slate-600 border border-slate-200">
                              {entry.invoiceNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {entry.notes || (entry.type === 'PURCHASE' ? 'Bill on credit' : 'Cash settlement')} •{' '}
                          <span className="font-mono">{formatDate(entry.date)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-black text-sm block ${
                          entry.type === 'PURCHASE' ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {entry.type === 'PURCHASE' ? '+' : '-'}
                        {formatCurrency(entry.amount, currency, currencySymbol)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              {selectedLedgerCustomer.balance > 0 ? (
                <button
                  type="button"
                  onClick={() => sendWhatsAppReminder(selectedLedgerCustomer)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Statement</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-600">✓ Account fully settled</span>
              )}
              <button
                type="button"
                onClick={() => setSelectedLedgerCustomer(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Register Khata Customer</h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Credit Limit ({currencySymbol})</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{addLoading ? 'Creating...' : 'Register Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersKhata;
