import React, { useState } from 'react';
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
} from 'lucide-react';
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
  const [error, setError] = useState(null);

  // Math Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const numDiscount = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
  const discountedSubtotal = Math.max(0, subtotal - numDiscount);
  const tax = applyTax ? Math.round((discountedSubtotal * (taxRate || 5)) / 100) : 0;
  const grandTotal = discountedSubtotal + tax;

  const numTendered = parseFloat(amountTendered) || grandTotal;
  const changeDue = Math.max(0, numTendered - grandTotal);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Cart is empty. Add products to generate a bill.');
      return;
    }

    if (paymentMethod === 'Credit' && !customerPhone.trim()) {
      setError('Customer phone number is required for Store Credit (Khata) sales.');
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
    };

    onCheckout(payload);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Active Counter Bill</h3>
            <span className="text-[11px] font-semibold text-slate-500">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} items in cart
            </span>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
            <ShoppingBag className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold">Cart is currently empty</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click products on the left to add items</p>
          </div>
        ) : (
          cart.map((item) => {
            const itemTotal = item.product.sellingPrice * item.quantity;
            const isMaxStock = item.quantity >= item.product.stockQuantity;

            return (
              <div
                key={item.product._id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h5>
                  <p className="text-[10px] text-slate-400">
                    {formatCurrency(item.product.sellingPrice, currency, currencySymbol)} × {item.quantity}{' '}
                    = <span className="font-bold text-slate-700">{formatCurrency(itemTotal, currency, currencySymbol)}</span>
                  </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-5 text-center text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isMaxStock}
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product._id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Controls & Checkout Form */}
      {cart.length > 0 && (
        <form onSubmit={handleCheckoutSubmit} className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3.5 flex-shrink-0">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Details Accordion/Inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Customer Name (opt)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
            <input
              type="tel"
              placeholder="Customer Phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
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
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                      paymentMethod === pm.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{pm.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered Input (if cash) */}
          {paymentMethod === 'Cash' && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Cash Given:</span>
              <input
                type="number"
                placeholder={grandTotal.toString()}
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                className="w-24 px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
              />
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">Change:</span>
              <span className="font-bold text-emerald-700 ml-auto">
                {formatCurrency(changeDue, currency, currencySymbol)}
              </span>
            </div>
          )}

          {/* Math Breakdown */}
          <div className="space-y-1 text-xs pt-1 border-t border-slate-200 text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">
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
                className="w-20 px-2 py-0.5 text-xs text-right rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>GST Tax ({taxRate}%):</span>
              </label>
              <span>{formatCurrency(tax, currency, currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-emerald-700">
                {formatCurrency(grandTotal, currency, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
