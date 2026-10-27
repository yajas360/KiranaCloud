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
  const numDiscount = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
  const discountedSubtotal = Math.max(0, subtotal - numDiscount);
  const tax = applyTax ? Math.round((discountedSubtotal * (taxRate || 5)) / 100) : 0;
  const grandTotal = discountedSubtotal + tax;

  const numTendered = parseFloat(amountTendered) || grandTotal;
  const changeDue = Math.max(0, numTendered - grandTotal);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Cart is empty. Add products to generate a bill.');
      return;
    }

    if (paymentMethod === 'Credit' && !customerPhone.trim()) {
      setError('Please select a registered Khata account to issue store credit.');
      return;
    }

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Counter Bill</h3>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
            {cart.reduce((sum, i) => sum + i.quantity, 0)} items
          </span>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-center text-slate-400">
            <ShoppingBag className="w-6 h-6 text-slate-300 mb-1" />
            <p className="text-xs font-bold text-slate-600">Cart is empty</p>
            <p className="text-[11px] text-slate-400">Click products on the left to add items</p>
          </div>
        ) : (
          cart.map((item) => {
            const itemTotal = item.product.sellingPrice * item.quantity;
            const isMaxStock = item.quantity >= item.product.stockQuantity;

            return (
              <div
                key={item.product._id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-slate-900 truncate leading-snug">{item.product.name}</h5>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {formatCurrency(item.product.sellingPrice, currency, currencySymbol)} × {item.quantity}{' '}
                    = <span className="font-bold text-slate-900">{formatCurrency(itemTotal, currency, currencySymbol)}</span>
                  </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
                    className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-mono font-bold w-5 text-center text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isMaxStock}
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
                    className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition ml-0.5"
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
        <form onSubmit={handleCheckoutSubmit} className="p-3.5 border-t border-slate-200 bg-slate-50/70 space-y-3 flex-shrink-0">
          {error && (
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
              {showCreditOverride && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
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
            <div className="space-y-1.5 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-950 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Khata Account *</span>
                </span>
                <Link to="/khata" className="text-[10px] text-emerald-700 hover:underline font-bold">
                  + Manage Khata
                </Link>
              </div>

              {loadingKhata ? (
                <p className="text-[11px] text-slate-500 py-1">Loading registered Khata accounts...</p>
              ) : khataCustomers.length === 0 ? (
                <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  <span>No registered Khata accounts found. </span>
                  <Link to="/khata" className="font-bold underline text-rose-800">
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
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Choose Registered Customer --</option>
                  {khataCustomers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone}) — Debt: {currencySymbol}{c.balance} / Limit: {currencySymbol}{c.creditLimit}
                    </option>
                  ))}
                </select>
              )}

              {selectedCustomerId && (() => {
                const cust = khataCustomers.find((c) => c._id === selectedCustomerId);
                if (!cust) return null;
                const remaining = Math.max(0, cust.creditLimit - cust.balance);
                return (
                  <div className="flex justify-between items-center text-[10px] font-mono text-emerald-800 pt-0.5">
                    <span>Available Credit Room:</span>
                    <span className="font-bold">{formatCurrency(remaining, currency, currencySymbol)}</span>
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
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              />
              <input
                type="tel"
                placeholder="Customer Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
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
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition ${
                      paymentMethod === pm.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
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
            <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Tendered:</span>
              <input
                type="number"
                placeholder={grandTotal.toString()}
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                className="w-20 px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-slate-200 text-right"
              />
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-semibold">Change:</span>
              <span className="font-mono font-black text-emerald-700 ml-auto">
                {formatCurrency(changeDue, currency, currencySymbol)}
              </span>
            </div>
          )}

          {/* Math Breakdown */}
          <div className="space-y-1 text-xs border-t border-slate-200 pt-2 text-slate-600 font-mono">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(subtotal, currency, currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Discount ({currencySymbol}):</span>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-16 px-1.5 py-0.5 text-xs text-right rounded border border-slate-200 bg-white"
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
              <span>{formatCurrency(tax, currency, currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1.5">
              <span>Grand Total:</span>
              <span className="text-emerald-700 text-base">
                {formatCurrency(grandTotal, currency, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {loading ? 'Processing Sale...' : `Complete Sale (${formatCurrency(grandTotal, currency, currencySymbol)})`}
            </span>
          </button>
        </form>
      )}
    </div>
  );
};

export default CartDrawer;
