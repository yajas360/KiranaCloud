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
  const [totalAdvance, setTotalAdvance] = useState(0);
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
        setTotalAdvance(res.data.totalAdvanceCredit || 0);
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

    if (!newCustName.trim() || newCustName.trim().length < 2) {
      setAddError('Customer Name must be at least 2 characters long.');
      return;
    }

    const cleanPhone = newCustPhone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setAddError('Phone Number must be a valid 10-digit number.');
      return;
    }

    const limit = parseFloat(newCustLimit);
    if (isNaN(limit) || limit < 0) {
      setAddError('Credit limit cannot be negative.');
      return;
    }

    if (limit > 500000) {
      setAddError('Credit limit cannot exceed 5,00,000.');
      return;
    }

    try {
      setAddLoading(true);
      await api.post('/customers', {
        name: newCustName.trim(),
        phone: cleanPhone,
        creditLimit: limit,
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
    let msg = '';
    if (customer.balance > 0) {
      msg = `Hello ${customer.name}, this is a gentle reminder from ${storeName || 'our store'} regarding your outstanding store credit balance of ${currencySymbol}${customer.balance.toFixed(2)}. Kindly clear your dues via cash or UPI at your earliest convenience. Thank you!`;
    } else if (customer.balance < 0) {
      msg = `Hello ${customer.name}, greetings from ${storeName || 'our store'}! You currently have an Advance Store Credit of ${currencySymbol}${Math.abs(customer.balance).toFixed(2)} in your Khata account. You can use this balance for your next grocery purchase. Thank you!`;
    } else {
      msg = `Hello ${customer.name}, thank you for shopping with ${storeName || 'our store'}! Your Khata credit account is currently fully settled (₹0.00 dues). Have a great day!`;
    }
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Customer Khata (Credit Ledger)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer credit, advance deposits, outstanding dues, and cash/UPI settlements.
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

      {/* KPI Cards: Debt, Advance Credit & Total Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Outstanding Debt
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(totalCredit, currency, currencySymbol)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Credit owed by customers to store</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Customer Advance Credit
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatCurrency(totalAdvance, currency, currencySymbol)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Prepaid store credit usable next time</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Khata Accounts
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{customers.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Registered credit ledger customers</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
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
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5 text-right font-bold text-slate-700 dark:text-slate-200">
                    Khata Balance / Status
                  </th>
                  <th className="px-4 py-3.5 text-right text-slate-500 dark:text-slate-400">Credit Limit</th>
                  <th className="px-4 py-3.5 text-center">Transactions</th>
                  <th className="px-5 py-3.5 text-right">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono">
                      {c.phone}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-sm">
                      {c.balance > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-rose-600 dark:text-rose-400 font-black">
                            {formatCurrency(c.balance, currency, currencySymbol)} Due
                          </span>
                          <span className="text-[10px] text-rose-500/80 font-normal">Customer owes store</span>
                        </div>
                      ) : c.balance < 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1">
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold">Advance Credit</span>
                            +{formatCurrency(Math.abs(c.balance), currency, currencySymbol)}
                          </span>
                          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal">Saved for next bill</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">₹0.00 (All Cleared)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 dark:text-slate-400 font-mono">
                      {formatCurrency(c.creditLimit, currency, currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLedgerCustomer(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] transition"
                        title="Click to view full transaction ledger"
                      >
                        <History className="w-3 h-3 text-slate-500" />
                        <span>{c.history?.length || 0} entries</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => sendWhatsAppReminder(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-[11px] border transition shadow-2xs ${
                          c.balance > 0
                            ? 'bg-green-50 dark:bg-green-950/60 hover:bg-green-600 text-green-700 dark:text-green-300 hover:text-white border-green-200 dark:border-green-800'
                            : c.balance < 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title={c.balance > 0 ? 'Send WhatsApp payment reminder' : c.balance < 0 ? 'Send WhatsApp advance credit note' : 'Send WhatsApp settlement confirmation'}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{c.balance > 0 ? 'Remind' : c.balance < 0 ? 'Statement' : 'WhatsApp'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setPayingCustomer(c);
                          setPaymentAmount(c.balance > 0 ? c.balance.toString() : '');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold text-[11px] border border-emerald-300 dark:border-emerald-700 transition shadow-2xs"
                        title="Record Cash/UPI settlement or advance deposit"
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
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {payingCustomer.balance > 0 ? 'Current Debt Owed:' : payingCustomer.balance < 0 ? 'Current Advance Credit:' : 'Khata Status:'}
                </span>
                <span className={`font-black text-sm ${payingCustomer.balance > 0 ? 'text-rose-600 dark:text-rose-400' : payingCustomer.balance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {payingCustomer.balance > 0
                    ? formatCurrency(payingCustomer.balance, currency, currencySymbol)
                    : payingCustomer.balance < 0
                    ? `+${formatCurrency(Math.abs(payingCustomer.balance), currency, currencySymbol)} (Advance)`
                    : 'All Cleared (₹0.00)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount Received ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm transition"
                />

                {/* Overpayment & Advance Credit Live Preview */}
                {parseFloat(paymentAmount) > 0 && (() => {
                  const pAmt = parseFloat(paymentAmount) || 0;
                  const currentBal = payingCustomer.balance || 0;
                  const resultingBal = Math.round((currentBal - pAmt) * 100) / 100;

                  if (resultingBal < 0) {
                    const advance = Math.abs(resultingBal);
                    return (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-[11px] text-emerald-800 dark:text-emerald-200">
                        <span className="font-bold">🌟 Customer will have +{formatCurrency(advance, currency, currencySymbol)} saved as Advance Credit!</span>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          This excess payment is saved in their Khata and will automatically be used to cover their next bill at checkout.
                        </p>
                      </div>
                    );
                  } else if (resultingBal === 0) {
                    return (
                      <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                        ✓ All debt will be fully cleared (₹0.00 balance).
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                        Remaining debt after payment: <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(resultingBal, currency, currencySymbol)}</span>
                      </div>
                    );
                  }
                })()}

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {payingCustomer.balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(payingCustomer.balance.toString())}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 transition"
                    >
                      Exact Due ({formatCurrency(payingCustomer.balance, currency, currencySymbol)})
                    </button>
                  )}
                  {payingCustomer.balance > 1 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(Math.round(payingCustomer.balance / 2).toString())}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 transition"
                    >
                      50% ({formatCurrency(Math.round(payingCustomer.balance / 2), currency, currencySymbol)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('500')}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 transition"
                  >
                    {currencySymbol}500
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('1000')}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 transition"
                  >
                    {currencySymbol}1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount('2000')}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 transition"
                  >
                    {currencySymbol}2,000
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Notes / Mode</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in Cash, GPay UPI reference #1234"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
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
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {selectedLedgerCustomer.balance > 0 ? 'Current Debt Owed' : selectedLedgerCustomer.balance < 0 ? '🌟 Advance Store Credit' : 'Khata Balance'}
                </span>
                <span className={`text-base font-black ${selectedLedgerCustomer.balance > 0 ? 'text-rose-600 dark:text-rose-400' : selectedLedgerCustomer.balance < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {selectedLedgerCustomer.balance > 0
                    ? formatCurrency(selectedLedgerCustomer.balance, currency, currencySymbol)
                    : selectedLedgerCustomer.balance < 0
                    ? `+${formatCurrency(Math.abs(selectedLedgerCustomer.balance), currency, currencySymbol)} (Saved)`
                    : '₹0.00 (All Cleared)'}
                </span>
                {selectedLedgerCustomer.balance < 0 && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                    Will auto-apply to next bill
                  </span>
                )}
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Credit Limit Ceiling</span>
                <span className="text-base font-black text-slate-700 dark:text-slate-200">
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold shadow-sm transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Phone Number *</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {newCustPhone.length}/10 digits
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210 (10 digits)"
                  value={newCustPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewCustPhone(digits);
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-lg border-2 focus:outline-none focus:ring-2 font-mono shadow-sm transition ${
                    newCustPhone.length === 10
                      ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/40 text-slate-900 font-bold'
                      : newCustPhone.length > 0
                      ? 'border-amber-400 focus:ring-amber-400 bg-amber-50/20 text-slate-900 font-bold'
                      : 'border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:ring-emerald-500'
                  }`}
                />
                <p className="mt-1 text-[10px]">
                  {newCustPhone.length === 10 ? (
                    <span className="text-emerald-600 font-medium">✓ Valid 10-digit phone number</span>
                  ) : (
                    <span className="text-slate-500">Must be a 10-digit phone number ({newCustPhone.length}/10 entered)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Credit Limit ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  max="500000"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
                  }}
                  placeholder="5000"
                  value={newCustLimit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      setNewCustLimit(val);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border-2 border-slate-300 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm transition"
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
