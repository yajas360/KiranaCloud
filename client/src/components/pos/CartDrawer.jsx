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
      setError('Customer phone must be a valid 10-digit number.');
      return;
    }

    // Open confirmation box before completing checkout
    setIsConfirmOpen(true);
  };

  const executeCheckout = async () => {
    setIsConfirmOpen(false);
    const payload = {
      items: cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      })),
      subtotal,
      discount: numDiscount,
      tax,
      grandTotal,
      paymentMethod,
      amountTendered: numTendered,
      changeDue,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      overrideCreditLimit,
    };

    const res = await onCheckout(payload);
    if (res && !res.success) {
      setError(res.message);
      if (res.creditLimitExceeded) {
        setShowCreditOverride(true);
      }
    } else {
      setShowCreditOverride(false);
      setOverrideCreditLimit(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Counter Bill</h3>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            {cart.reduce((sum, i) => sum + i.quantity, 0)} items
          </span>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-center text-slate-400 dark:text-slate-500">
            <ShoppingBag className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Cart is empty</p>
            <p className="text-[11px] text-slate-400">Click products on the left to add items</p>
          </div>
        ) : (
          cart.map((item) => {
            const itemTotal = item.product.sellingPrice * item.quantity;
            const isMaxStock = item.quantity >= item.product.stockQuantity;

            return (
              <div
                key={item.product._id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">{item.product.name}</h5>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatCurrency(item.product.sellingPrice, currency, currencySymbol)} × {item.quantity}{' '}
                    = <span className="font-bold text-slate-900 dark:text-emerald-400">{formatCurrency(itemTotal, currency, currencySymbol)}</span>
                  </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
                    className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center active:scale-95"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-mono font-bold w-5 text-center text-slate-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isMaxStock}
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
                    className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 flex items-center justify-center active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition ml-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Controls & Checkout Form */}
      {cart.length > 0 && (
        <form onSubmit={handleCheckoutSubmit} className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 space-y-3 flex-shrink-0">
          {error && (
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
              {showCreditOverride && (
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overrideCredit"
                    checked={overrideCreditLimit}
                    onChange={(e) => setOverrideCreditLimit(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="overrideCredit" className="font-bold cursor-pointer text-xs">
                    Authorize Store Manager Override
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Customer Selection or Inputs */}
          {paymentMethod === 'Credit' ? (
            <div className="space-y-1.5 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Khata Account *</span>
                </span>
                <Link to="/khata" className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold">
                  + Manage Khata
                </Link>
              </div>

              {loadingKhata ? (
                <p className="text-[11px] text-slate-500 py-1">Loading registered Khata accounts...</p>
              ) : khataCustomers.length === 0 ? (
                <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 p-2 rounded border border-rose-200 dark:border-rose-800">
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
                  className="w-full px-2.5 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Registered Customer --</option>
                  {khataCustomers.map((c) => {
                    const balanceNum = Number(c.balance) || 0;
                    const balanceLabel = balanceNum < 0
                      ? `🌟 Advance: +${currencySymbol}${Math.abs(balanceNum)}`
                      : balanceNum > 0
                        ? `Debt: ${currencySymbol}${balanceNum}`
                        : `Settled (₹0)`;
                    return (
                      <option key={c._id} value={c._id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
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
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="flex items-center gap-1">
                            <span>🌟 Customer Surplus Advance:</span>
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
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400">
                        <span>Current Khata Debt:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(balanceNum, currency, currencySymbol)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-mono text-emerald-800 dark:text-emerald-300">
                      <span>Available Credit Room:</span>
                      <span className="font-bold">{formatCurrency(remaining, currency, currencySymbol)}</span>
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
                className="px-2.5 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs shadow-sm"
              />
              <input
                type="tel"
                maxLength={10}
                placeholder="Phone (10 digits)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="px-2.5 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono shadow-sm"
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
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition shadow-xs ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pm.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered Input (if cash) */}
          {paymentMethod === 'Cash' && (
            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
              <span className="font-semibold">Tendered:</span>
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
                className="w-24 px-2 py-1 text-xs font-mono font-bold rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right shadow-sm"
              />
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="font-semibold">Change:</span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 ml-auto">
                {formatCurrency(changeDue, currency, currencySymbol)}
              </span>
            </div>
          )}

          {/* Math Breakdown */}
          <div className="space-y-1 text-xs border-t border-slate-200 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-300 font-mono">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(subtotal, currency, currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>
                Discount ({currencySymbol}) <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-medium">(max 50%)</span>:
              </span>
              <input
                type="number"
                min="0"
                max={maxDiscount}
                step="1"
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
                className="w-20 px-2 py-1 text-xs font-mono font-bold text-right rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                title={`Max discount allowed is 50% (${currencySymbol}${maxDiscount})`}
              />
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 cursor-pointer font-sans text-xs">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                />
                <span>GST Tax ({taxRate}%):</span>
              </label>
              <span className="text-slate-900 dark:text-white">{formatCurrency(tax, currency, currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-1.5">
              <span>Grand Total:</span>
              <span className="text-emerald-700 dark:text-emerald-400 text-base font-black">
                {formatCurrency(grandTotal, currency, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs active:scale-95 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Confirm Bill Checkout</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Are you sure you want to bill this cart?</p>
              </div>
            </div>

            {/* Bill summary preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Total Items:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} units ({cart.length} items)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Payment Mode:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px]">
                  {paymentMethod}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Customer:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                  {customerName.trim() || 'Walk-in Customer'}
                </span>
              </div>

              {paymentMethod === 'Cash' && amountTendered && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Change Due:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(changeDue, currency, currencySymbol)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 font-bold">
                <span className="text-slate-900 dark:text-white">Grand Total:</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 text-base font-mono">
                  {formatCurrency(grandTotal, currency, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Actions: Cancel vs Proceed */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="py-2.5 px-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={executeCheckout}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs active:scale-95 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Billing...' : 'Proceed & Bill'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDrawer;
