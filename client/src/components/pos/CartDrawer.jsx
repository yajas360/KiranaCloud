import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  User,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const CartDrawer = ({
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  loading = false,
}) => {
  const { currency, currencySymbol, taxRate } = useAuth();

  const [discount, setDiscount] = useState('');
  const [applyTax, setApplyTax] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [overrideCreditLimit, setOverrideCreditLimit] = useState(false);
  const [showCreditOverride, setShowCreditOverride] = useState(false);
  const [error, setError] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Khata Registered Customers
  const [khataCustomers, setKhataCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadingKhata, setLoadingKhata] = useState(false);

  useEffect(() => {
    if (paymentMethod === 'Credit') {
      setLoadingKhata(true);
      api.get('/customers')
        .then((res) => {
          if (res.data.success) {
            setKhataCustomers(res.data.data);
          }
        })
        .catch((err) => console.error('Failed to load Khata customers', err))
        .finally(() => setLoadingKhata(false));
    }
  }, [paymentMethod]);

  // Math Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const maxDiscount = Math.round(subtotal * 0.5 * 100) / 100;
  const numDiscount = Math.min(maxDiscount, Math.max(0, parseFloat(discount) || 0));
  const discountedSubtotal = Math.max(0, subtotal - numDiscount);
  const tax = applyTax ? Math.round((discountedSubtotal * (taxRate || 5)) / 100) : 0;
  const grandTotal = discountedSubtotal + tax;

  const numTendered = Math.max(0, parseFloat(amountTendered) || grandTotal);
  const changeDue = Math.max(0, numTendered - grandTotal);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Cart is empty. Add products to generate a bill.');
      return;
    }

    if (parseFloat(discount) < 0) {
      setError('Discount cannot be a negative amount.');
      return;
    }

    if (parseFloat(discount) > maxDiscount) {
      setError(`Discount cannot exceed 50% of bill value (Max: ${currencySymbol}${maxDiscount}).`);
      return;
    }

    if (paymentMethod === 'Cash' && amountTendered !== '' && parseFloat(amountTendered) < 0) {
      setError('Amount tendered cannot be a negative value.');
      return;
    }

    if (paymentMethod === 'Credit' && !customerPhone.trim()) {
      setError('Please select a registered Khata account to issue store credit.');
      return;
    }

    if (customerPhone.trim() && !/^\d{10}$/.test(customerPhone.trim())) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    // Open confirmation modal
    setIsConfirmOpen(true);
  };

  const handleProceedConfirmedCheckout = async () => {
    setIsConfirmOpen(false);
    setError(null);
    setShowCreditOverride(false);

    const payload = {
      items: cart.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        sellingPrice: item.product.sellingPrice,
        costPrice: item.product.costPrice,
      })),
      discount: numDiscount,
      applyTax,
      paymentMethod,
      amountTendered: paymentMethod === 'Cash' ? (amountTendered === '' ? grandTotal : parseFloat(amountTendered)) : grandTotal,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      overrideCreditLimit,
    };

    try {
      await onCheckout(payload);
      setDiscount('');
      setAmountTendered('');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomerId('');
      setOverrideCreditLimit(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Checkout failed. Please try again.';
      setError(msg);
      if (err.response?.status === 400 && msg.includes('Credit limit')) {
        setShowCreditOverride(true);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
            Current Order Ticket
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} units
          </span>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline uppercase tracking-wider"
          >
            Clear Ticket
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 p-2.5 space-y-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-400 text-center p-4">
            <ShoppingBag className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Ticket is Empty
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Select or scan items from the catalog
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const isMaxStock = item.quantity >= item.product.stockQuantity;
            const itemTotal = item.product.sellingPrice * item.quantity;

            return (
              <div key={item.product._id} className="pt-2 pb-2 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-[11px]">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                    <span>
                      {formatCurrency(item.product.sellingPrice, currency, currencySymbol)} &times; {item.quantity}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">
                      {formatCurrency(itemTotal, currency, currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
                    className="w-5 h-5 rounded-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center active:translate-y-[1px]"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-zinc-900 dark:text-white text-[11px]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isMaxStock}
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
                    className="w-5 h-5 rounded-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center active:translate-y-[1px]"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product._id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition ml-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Calculation & Checkout Form */}
      {cart.length > 0 && (
        <form onSubmit={handleCheckoutSubmit} className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 space-y-3 flex-shrink-0">
          {error && (
            <div className="space-y-1.5">
              <div className="p-2 rounded-none bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
              {showCreditOverride && (
                <div className="p-2 rounded-none bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overrideCredit"
                    checked={overrideCreditLimit}
                    onChange={(e) => setOverrideCreditLimit(e.target.checked)}
                    className="rounded-none text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="overrideCredit" className="font-bold cursor-pointer text-xs uppercase tracking-wider">
                    Authorize Manager Override
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Customer Selection or Inputs */}
          {paymentMethod === 'Credit' ? (
            <div className="space-y-1.5 p-2.5 rounded-none bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>Khata Account *</span>
                </span>
                <Link to="/khata" className="text-[10px] text-blue-700 dark:text-blue-400 hover:underline font-bold uppercase tracking-wider">
                  + Manage Khata
                </Link>
              </div>

              {loadingKhata ? (
                <p className="text-[11px] text-zinc-500 py-1">Loading registered Khata accounts...</p>
              ) : khataCustomers.length === 0 ? (
                <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-none border border-rose-300 dark:border-rose-800">
                  <span>No registered Khata accounts found. </span>
                  <Link to="/khata" className="font-bold underline text-rose-800 dark:text-rose-200">
                    Register a customer in Khata first
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const custId = e.target.value;
                    setSelectedCustomerId(custId);
                    const found = khataCustomers.find((c) => c._id === custId);
                    if (found) {
                      setCustomerName(found.name);
                      setCustomerPhone(found.phone);
                    } else {
                      setCustomerName('');
                      setCustomerPhone('');
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs font-semibold text-zinc-900 dark:text-white"
                >
                  <option value="">-- Choose Registered Customer --</option>
                  {khataCustomers.map((c) => {
                    const balanceNum = Number(c.balance) || 0;
                    const balanceLabel = balanceNum < 0
                      ? `Surplus Advance: +${currencySymbol}${Math.abs(balanceNum)}`
                      : balanceNum > 0
                        ? `Debt: ${currencySymbol}${balanceNum}`
                        : `Settled (₹0)`;
                    return (
                      <option key={c._id} value={c._id} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                        {c.name} ({c.phone}) — {balanceLabel} / Limit: {currencySymbol}{c.creditLimit}
                      </option>
                    );
                  })}
                </select>
              )}

              {selectedCustomerId && (() => {
                const cust = khataCustomers.find((c) => c._id === selectedCustomerId);
                if (!cust) return null;
                const balanceNum = Number(cust.balance) || 0;
                const isAdvance = balanceNum < 0;
                const advanceAmount = Math.abs(balanceNum);
                const remaining = isAdvance ? cust.creditLimit + advanceAmount : Math.max(0, cust.creditLimit - balanceNum);
                return (
                  <div className="space-y-1 pt-1">
                    {isAdvance ? (
                      <div className="p-2 rounded-none bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="flex items-center gap-1 uppercase tracking-wider font-mono">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Customer Surplus Advance:</span>
                          </span>
                          <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                            +{formatCurrency(advanceAmount, currency, currencySymbol)}
                          </span>
                        </div>
                        {grandTotal > 0 && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                            Will apply {formatCurrency(Math.min(advanceAmount, grandTotal), currency, currencySymbol)} from surplus.
                            {advanceAmount >= grandTotal
                              ? ` Remaining surplus after bill: +${formatCurrency(advanceAmount - grandTotal, currency, currencySymbol)}.`
                              : ` Remaining ₹${(grandTotal - advanceAmount).toFixed(2)} will be billed as new Khata debt.`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                        <span>Current Khata Debt:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(balanceNum, currency, currencySymbol)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                      <span>Available Credit Room:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(remaining, currency, currencySymbol)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-2.5 py-1.5 rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs shadow-sm"
              />
              <input
                type="tel"
                maxLength={10}
                placeholder="Phone (10 digits)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="px-2.5 py-1.5 rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs font-mono shadow-sm"
              />
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'Cash', icon: Banknote },
                { id: 'UPI', icon: QrCode },
                { id: 'Card', icon: CreditCard },
                { id: 'Credit', icon: UserCheck },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2 px-1 rounded-none text-[10px] font-bold flex flex-col items-center gap-0.5 transition uppercase tracking-wider ${
                      isSelected
                        ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pm.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered Input & Quick Presets */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-800 px-2.5 py-1.5 rounded-none border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-200 shadow-sm">
                <span className="font-bold uppercase tracking-wider text-[10px]">Tendered:</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={grandTotal.toString()}
                  value={amountTendered}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setAmountTendered('');
                      return;
                    }
                    const num = parseFloat(val);
                    if (num < 0 || isNaN(num)) {
                      setAmountTendered('0');
                      return;
                    }
                    setAmountTendered(val);
                  }}
                  className="w-24 px-2 py-1 text-xs font-mono font-bold rounded-none border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-right"
                />
                <span className="text-zinc-300 dark:text-zinc-600">|</span>
                <span className="font-bold uppercase tracking-wider text-[10px]">Change:</span>
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 ml-auto">
                  {formatCurrency(changeDue, currency, currencySymbol)}
                </span>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex items-center gap-1">
                {[
                  { label: 'Exact', val: grandTotal },
                  { label: '+50', val: Math.ceil(grandTotal / 50) * 50 },
                  { label: '+100', val: Math.ceil(grandTotal / 100) * 100 },
                  { label: '+500', val: Math.ceil(grandTotal / 500) * 500 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAmountTendered(preset.val.toString())}
                    className="flex-1 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:translate-y-[1px]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Math Breakdown Ticket */}
          <div className="space-y-1 text-xs border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-2 text-zinc-600 dark:text-zinc-300 font-mono">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {formatCurrency(subtotal, currency, currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>
                Discount ({currencySymbol}) <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans font-medium">(max 50%)</span>:
              </span>
              <input
                type="number"
                min="0"
                max={maxDiscount}
                step="0.5"
                placeholder="0"
                value={discount}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDiscount('');
                    return;
                  }
                  const num = parseFloat(val);
                  if (num < 0 || isNaN(num)) {
                    setDiscount('0');
                    return;
                  }
                  if (num > maxDiscount) {
                    setDiscount(maxDiscount.toString());
                    return;
                  }
                  setDiscount(val);
                }}
                className="w-20 px-2 py-0.5 text-xs font-mono rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 cursor-pointer font-sans text-xs">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="rounded-none text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>GST Tax ({taxRate}%):</span>
              </label>
              <span className="text-zinc-900 dark:text-white">{formatCurrency(tax, currency, currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-sm font-black text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 pt-1.5">
              <span>Grand Total:</span>
              <span className="text-zinc-900 dark:text-white text-base font-black">
                {formatCurrency(grandTotal, currency, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition border border-blue-700 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 active:translate-y-[1px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {loading ? 'Processing Sale...' : `Complete Sale (${formatCurrency(grandTotal, currency, currencySymbol)})`}
            </span>
          </button>
        </form>
      )}

      {/* Confirmation Modal before generating Bill */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-none border border-zinc-300 dark:border-zinc-700 p-5 space-y-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Confirm Bill Checkout</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Review ticket before printing receipt</p>
              </div>
            </div>

            {/* Bill summary preview */}
            <div className="p-3.5 rounded-none bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Total Items:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} units ({cart.length} items)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Payment Mode:</span>
                <span className="font-bold px-2 py-0.5 rounded-none bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[11px] uppercase tracking-wider font-mono">
                  {paymentMethod}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Customer:</span>
                <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[160px]">
                  {customerName.trim() || 'Walk-in Customer'}
                </span>
              </div>

              {paymentMethod === 'Cash' && amountTendered && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Change Due:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(changeDue, currency, currencySymbol)}
                  </span>
                </div>
              )}

              <div className="border-t border-zinc-300 dark:border-zinc-700 pt-2 flex justify-between items-center">
                <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Bill Amount:</span>
                <span className="font-mono text-base font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(grandTotal, currency, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="py-2.5 px-3 rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-bold text-xs uppercase tracking-wider transition active:translate-y-[1px]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedConfirmedCheckout}
                className="py-2.5 px-3 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider border border-blue-700 transition flex items-center justify-center gap-1.5 active:translate-y-[1px] shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDrawer;
