import React from 'react';
import { X, Printer, CheckCircle, Store, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ReceiptModal = ({ isOpen, onClose, saleData }) => {
  const { currency, currencySymbol } = useAuth();

  if (!isOpen || !saleData) return null;

  const {
    invoiceNumber,
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    grandTotal = 0,
    paymentMethod = 'Cash',
    amountTendered = 0,
    changeDue = 0,
    customerName = 'Walk-in Customer',
    customerPhone = '',
    date = new Date(),
    store = {},
  } = saleData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Action Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Sale Completed Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Area */}
        <div id="printable-receipt" className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
          {/* Store branding */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <div className="w-9 h-9 mx-auto rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-1">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
              {store.storeName || 'Corner Mart & Superstore'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{store.storeAddress || 'Main Market Road'}</p>
            <p className="text-[11px] text-slate-500">Phone: {store.storePhone || '+91 98765 43210'}</p>
          </div>

          {/* Invoice Meta */}
          <div className="flex justify-between text-[11px] text-slate-600 border-b border-dashed border-slate-200 pb-2">
            <div>
              <p className="font-bold text-slate-800">Invoice: {invoiceNumber}</p>
              <p>Customer: {customerName} {customerPhone ? `(${customerPhone})` : ''}</p>
            </div>
            <div className="text-right">
              <p>{formatDate(date, 'short')}</p>
              <p>{formatDate(date, 'time')}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-1.5 py-1">
            <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-1">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Price</span>
              <span className="w-1/6 text-right">Total</span>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-slate-700 py-0.5">
                <span className="w-1/2 truncate font-sans text-xs">{item.name}</span>
                <span className="w-1/6 text-center">{item.quantity}</span>
                <span className="w-1/6 text-right">{item.sellingPrice}</span>
                <span className="w-1/6 text-right font-semibold">{item.total}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, currency, currencySymbol)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>− {formatCurrency(discount, currency, currencySymbol)}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>GST Tax:</span>
                <span>+ {formatCurrency(tax, currency, currencySymbol)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-1">
              <span>GRAND TOTAL:</span>
              <span className="text-emerald-700">{formatCurrency(grandTotal, currency, currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-1">
              <span>Payment Mode:</span>
              <span className="font-bold text-slate-700 uppercase">{paymentMethod}</span>
            </div>

            {paymentMethod === 'Cash' && (
              <>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(amountTendered, currency, currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Change Given:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(changeDue, currency, currencySymbol)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
            <p>Thank you for shopping with us!</p>
            <p>Please visit again.</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-sm"
          >
            <span>Next Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
