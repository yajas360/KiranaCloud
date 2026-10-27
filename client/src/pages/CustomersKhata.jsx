import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Trash2,
  Check,
  AlertCircle,
  MessageSquare,
  Receipt,
  X,
  Coins,
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

  // Payment Settlement / Refund Modal
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('Cash payment');
  const [isRefundMode, setIsRefundMode] = useState(false);
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

  // Calculate true net balance from ledger transactions
  const getCustomerEffectiveBalance = (c) => {
    if (Array.isArray(c.history) && c.history.length > 0) {
      const computed = c.history.reduce((sum, h) => {
        if (h.type === 'PURCHASE') return sum + (Number(h.amount) || 0);
        if (h.type === 'PAYMENT') return sum - (Number(h.amount) || 0);
        if (h.type === 'REFUND') return sum + (Number(h.amount) || 0);
        return sum;
      }, 0);
      return Math.round(computed * 100) / 100;
    }
    return c.balance || 0;
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers${searchTerm ? `?search=${searchTerm}` : ''}`);
      if (res.data.success) {
        const custs = res.data.data.map((c) => ({
          ...c,
          balance: getCustomerEffectiveBalance(c),
        }));
        setCustomers(custs);
        const debt = custs.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
        const advance = custs.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
        setTotalCredit(Math.round(debt * 100) / 100);
        setTotalAdvance(Math.round(advance * 100) / 100);
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
      setPaymentError('Amount must be greater than zero.');
      return;
    }

    try {
      setPaymentLoading(true);
      await api.post(`/customers/${payingCustomer._id}/payment`, {
        amount: amt,
        notes: paymentNotes,
        isRefund: isRefundMode,
      });
      setPayingCustomer(null);
      setPaymentAmount('');
      setIsRefundMode(false);
      fetchCustomers();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record transaction.');
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
    const bal = getCustomerEffectiveBalance(customer);
    let msg = '';
    if (bal > 0) {
      msg = `Hello ${customer.name}, this is a gentle reminder from ${storeName || 'our store'} regarding your outstanding store credit balance of ${currencySymbol}${bal.toFixed(2)}. Kindly clear your dues via cash or UPI at your earliest convenience. Thank you!`;
    } else if (bal < 0) {
      msg = `Hello ${customer.name}, greetings from ${storeName || 'our store'}! You currently have a surplus advance credit of ${currencySymbol}${Math.abs(bal).toFixed(2)} in your Khata account. This balance is safely stored with us and will automatically cover your upcoming grocery purchases. Thank you!`;
    } else {
      msg = `Hello ${customer.name}, thank you for shopping with ${storeName || 'our store'}! Your Khata credit account is currently fully settled (₹0.00 dues). Have a great day!`;
    }
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Customer Khata (Credit Ledger)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer credit, surplus advance deposits, outstanding dues, and cash/UPI settlements.
          </p>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Khata Customer</span>
        </button>
      </div>

      {/* KPI Cards: Debt, Advance Surplus & Total Accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Outstanding Debt
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
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
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Customer Advance Surplus
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              +{formatCurrency(totalAdvance, currency, currencySymbol)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Surplus money held by store for future bills</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Active Khata Accounts
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{customers.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Registered credit ledger accounts</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                {customers.map((c) => {
                  const effectiveBal = getCustomerEffectiveBalance(c);
                  const isSurplus = effectiveBal < 0;
                  const surplusAmt = Math.abs(effectiveBal);

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">{c.name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono">
                        {c.phone}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-sm">
                        {effectiveBal > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-rose-600 dark:text-rose-400 font-black font-mono">
                              {formatCurrency(effectiveBal, currency, currencySymbol)} Due
                            </span>
                            <span className="text-[10px] text-rose-500/80 font-normal">Customer owes store</span>
                          </div>
                        ) : isSurplus ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-700 dark:text-emerald-400 font-black font-mono flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                                Surplus Advance
                              </span>
                              +{formatCurrency(surplusAmt, currency, currencySymbol)}
                            </span>
                            <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/80 font-normal">
                              Surplus left with store (Covers next bill)
                            </span>
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
                            effectiveBal > 0
                              ? 'bg-green-50 dark:bg-green-950/60 hover:bg-green-600 text-green-700 dark:text-green-300 hover:text-white border-green-200 dark:border-green-800'
                              : isSurplus
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                          title={effectiveBal > 0 ? 'Send WhatsApp payment reminder' : isSurplus ? 'Send WhatsApp surplus advance statement' : 'Send WhatsApp settlement confirmation'}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{effectiveBal > 0 ? 'Remind' : isSurplus ? 'Statement' : 'WhatsApp'}</span>
                        </button>

                        {isSurplus ? (
                          <button
                            onClick={() => {
                              setPayingCustomer(c);
                              setIsRefundMode(true);
                              setPaymentAmount(surplusAmt.toString());
                              setPaymentNotes('Cash refund of surplus advance balance');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-bold text-[11px] border border-amber-300 dark:border-amber-700 transition shadow-2xs"
                            title="Refund surplus advance to customer in cash"
                          >
                            <span>💸 Refund Cash</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => {
                            setPayingCustomer(c);
                            setIsRefundMode(false);
                            setPaymentAmount(effectiveBal > 0 ? effectiveBal.toString() : '');
                            setPaymentNotes('Cash payment');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold text-[11px] border border-emerald-300 dark:border-emerald-700 transition shadow-2xs"
                          title={isSurplus ? 'Add more advance deposit' : 'Record Cash/UPI settlement'}
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>{isSurplus ? '+ Add Advance' : 'Record Payment'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCustomer(c._id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title="Delete Khata Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment / Refund Settlement Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isRefundMode ? 'Refund Surplus Cash' : 'Record Khata Payment / Deposit'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{payingCustomer.name} • {payingCustomer.phone}</p>
              </div>
              <button
                onClick={() => {
                  setPayingCustomer(null);
                  setIsRefundMode(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {(() => {
                const bal = getCustomerEffectiveBalance(payingCustomer);
                const hasSurplus = bal < 0;
                const surplusAmt = Math.abs(bal);

                return (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {hasSurplus ? 'Current Surplus Advance with Store:' : bal > 0 ? 'Current Debt Owed:' : 'Khata Status:'}
                    </span>
                    <span className={`font-black text-sm font-mono ${bal > 0 ? 'text-rose-600 dark:text-rose-400' : hasSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                      {bal > 0
                        ? formatCurrency(bal, currency, currencySymbol)
                        : hasSurplus
                        ? `+${formatCurrency(surplusAmt, currency, currencySymbol)} (Surplus)`
                        : 'All Cleared (₹0.00)'}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isRefundMode ? `Cash Refund Amount (${currencySymbol}) *` : `Amount Received (${currencySymbol}) *`}
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-mono shadow-sm transition"
                />

                {/* Overpayment & Advance Credit Live Preview */}
                {parseFloat(paymentAmount) > 0 && (() => {
                  const pAmt = parseFloat(paymentAmount) || 0;
                  const currentBal = getCustomerEffectiveBalance(payingCustomer);

                  if (isRefundMode) {
                    const currentSurplus = currentBal < 0 ? Math.abs(currentBal) : 0;
                    const remainingSurplus = Math.max(0, currentSurplus - pAmt);
                    return (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-[11px] text-amber-900 dark:text-amber-200">
                        <span className="font-bold">Returning {formatCurrency(pAmt, currency, currencySymbol)} cash to {payingCustomer.name}.</span>
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">
                          Remaining customer surplus after refund: +{formatCurrency(remainingSurplus, currency, currencySymbol)}.
                        </p>
                      </div>
                    );
                  }

                  const resultingBal = Math.round((currentBal - pAmt) * 100) / 100;

                  if (resultingBal < 0) {
                    const advance = Math.abs(resultingBal);
                    return (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-[11px] text-emerald-800 dark:text-emerald-200">
                        <span className="font-bold">🌟 Customer will have +{formatCurrency(advance, currency, currencySymbol)} saved as Advance Surplus!</span>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          This excess payment is stored in their Khata and will automatically deduct from future bills at checkout.
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isRefundMode ? 'Refund Notes / Mode' : 'Payment Notes / Mode'}
                </label>
                <input
                  type="text"
                  placeholder={isRefundMode ? 'e.g. Cash refund of advance surplus given to customer' : 'e.g. Paid in Cash, GPay UPI reference #1234'}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setPayingCustomer(null);
                    setIsRefundMode(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition disabled:opacity-50 ${
                    isRefundMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {paymentLoading
                      ? 'Processing...'
                      : isRefundMode
                      ? 'Confirm Cash Refund'
                      : 'Record Payment'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger History Modal */}
      {selectedLedgerCustomer && (() => {
        const historyList = selectedLedgerCustomer.history || [];
        const totalPurchases = historyList
          .filter((h) => h.type === 'PURCHASE')
          .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
        const totalPayments = historyList
          .filter((h) => h.type === 'PAYMENT')
          .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
        const totalRefunds = historyList
          .filter((h) => h.type === 'REFUND')
          .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

        const effectiveBal = getCustomerEffectiveBalance(selectedLedgerCustomer);
        const isSurplus = effectiveBal < 0;
        const surplusAmt = Math.abs(effectiveBal);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedLedgerCustomer.name} - Khata Ledger
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Phone: {selectedLedgerCustomer.phone}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLedgerCustomer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Balances summary cards */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    {isSurplus ? '🌟 Customer Surplus / Advance' : effectiveBal > 0 ? 'Current Debt Owed' : 'Khata Balance'}
                  </span>
                  <span className={`text-lg font-black font-mono block mt-0.5 ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : effectiveBal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {isSurplus
                      ? `+${formatCurrency(surplusAmt, currency, currencySymbol)} (Surplus)`
                      : effectiveBal > 0
                      ? formatCurrency(effectiveBal, currency, currencySymbol)
                      : '₹0.00 (All Cleared)'}
                  </span>
                  {isSurplus ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                      Surplus left with store • Auto-applies to next bill
                    </span>
                  ) : effectiveBal > 0 ? (
                    <span className="text-[10px] text-rose-500 font-medium block mt-0.5">
                      Customer owes store
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      All settled up
                    </span>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Credit Limit Ceiling</span>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-200 font-mono block mt-0.5">
                    {formatCurrency(selectedLedgerCustomer.creditLimit, currency, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                    Available room: {formatCurrency(isSurplus ? selectedLedgerCustomer.creditLimit + surplusAmt : Math.max(0, selectedLedgerCustomer.creditLimit - effectiveBal), currency, currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Surplus Breakdown Banner (When customer has excess paid funds) */}
              {isSurplus && (
                <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/60 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <span>🌟 Surplus Balance Summary:</span>
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 text-sm font-black">
                      +{formatCurrency(surplusAmt, currency, currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-800 dark:text-emerald-300 pt-0.5 font-mono">
                    <span>Total Purchases: {formatCurrency(totalPurchases, currency, currencySymbol)}</span>
                    <span>Total Paid: {formatCurrency(totalPayments, currency, currencySymbol)}</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300/90 pt-0.5">
                    {selectedLedgerCustomer.name} has paid more than their purchases. This surplus of {formatCurrency(surplusAmt, currency, currencySymbol)} is saved in your store Khata and will automatically deduct from future bills at checkout.
                  </p>
                </div>
              )}

              {/* Chronological Entries */}
              <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
                {historyList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">No transactions recorded yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Credit purchases and payment settlements will appear here.
                    </p>
                  </div>
                ) : (
                  [...historyList].reverse().map((entry, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                        entry.type === 'PURCHASE'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                          : entry.type === 'REFUND'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                          : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            entry.type === 'PURCHASE'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                              : entry.type === 'REFUND'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          }`}
                        >
                          {entry.type === 'PURCHASE' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : entry.type === 'REFUND' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {entry.type === 'PURCHASE'
                                ? 'Store Credit Purchase'
                                : entry.type === 'REFUND'
                                ? 'Surplus Cash Refunded'
                                : 'Payment Received'}
                            </span>
                            {entry.invoiceNumber && (
                              <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {entry.invoiceNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {entry.notes || (entry.type === 'PURCHASE' ? 'Bill on credit' : 'Cash settlement')} •{' '}
                            <span className="font-mono">{formatDate(entry.date)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-black text-sm block ${
                            entry.type === 'PURCHASE'
                              ? 'text-rose-600 dark:text-rose-400'
                              : entry.type === 'REFUND'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {entry.type === 'PURCHASE' ? '+' : entry.type === 'REFUND' ? '+[Refund] ' : '-'}
                          {formatCurrency(entry.amount, currency, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sendWhatsAppReminder(selectedLedgerCustomer)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Statement</span>
                  </button>

                  {isSurplus && (
                    <button
                      type="button"
                      onClick={() => {
                        setPayingCustomer(selectedLedgerCustomer);
                        setIsRefundMode(true);
                        setPaymentAmount(surplusAmt.toString());
                        setPaymentNotes('Cash refund of surplus advance balance');
                        setSelectedLedgerCustomer(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-700 transition"
                      title="Return customer surplus money in cash"
                    >
                      <span>💸 Refund Surplus Cash</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLedgerCustomer(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Khata Customer</h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold shadow-sm transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number *</label>
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
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border-2 focus:outline-none focus:ring-2 font-mono shadow-sm transition ${
                    newCustPhone.length === 10
                      ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 text-slate-900 dark:text-white font-bold'
                      : newCustPhone.length > 0
                      ? 'border-amber-400 focus:ring-amber-400 bg-amber-50/20 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-emerald-500'
                  }`}
                />
                <p className="mt-1 text-[10px]">
                  {newCustPhone.length === 10 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Valid 10-digit phone number</span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">Must be a 10-digit phone number ({newCustPhone.length}/10 entered)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Credit Limit ({currencySymbol})</label>
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
                  className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white focus:bg-white text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
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
