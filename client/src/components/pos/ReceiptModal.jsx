import React, { useState } from 'react';
import { X, Printer, Download, Copy, Check, CheckCircle, Store } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ReceiptModal = ({ isOpen, onClose, saleData }) => {
  const { currency, currencySymbol } = useAuth();
  const [copied, setCopied] = useState(false);

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

  const generateReceiptText = () => {
    const sName = store.storeName || 'KiranaCloud Retail';
    const sAddr = store.storeAddress || 'Main Market Road';
    const sPhone = store.storePhone || '+91 98765 43210';
    const dt = new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let text = '';
    text += '========================================\n';
    text += `       ${sName.toUpperCase()}\n`;
    text += `     ${sAddr}\n`;
    text += `       Phone: ${sPhone}\n`;
    text += '========================================\n';
    text += `Invoice: ${invoiceNumber}\n`;
    text += `Date: ${dt}\n`;
    text += `Customer: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}\n`;
    text += '----------------------------------------\n';
    text += 'ITEM                 QTY   PRICE   TOTAL\n';
    text += '----------------------------------------\n';

    items.forEach((it) => {
      const name = (it.name || '').substring(0, 18).padEnd(19, ' ');
      const qty = String(it.quantity).padStart(3, ' ');
      const price = String(it.sellingPrice).padStart(7, ' ');
      const total = String(it.total).padStart(7, ' ');
      text += `${name} ${qty} ${price} ${total}\n`;
    });

    text += '----------------------------------------\n';
    text += `Subtotal:              ${currencySymbol}${subtotal}\n`;
    if (discount > 0) {
      text += `Discount:             -${currencySymbol}${discount}\n`;
    }
    if (tax > 0) {
      text += `GST Tax:              +${currencySymbol}${tax}\n`;
    }
    text += `GRAND TOTAL:           ${currencySymbol}${grandTotal}\n`;
    text += `Payment Mode:          ${paymentMethod.toUpperCase()}\n`;
    if (paymentMethod === 'Cash') {
      text += `Cash Tendered:         ${currencySymbol}${amountTendered}\n`;
      text += `Change Due:            ${currencySymbol}${changeDue}\n`;
    }
    text += '========================================\n';
    text += '     Thank you for shopping with us!\n';
    text += '========================================\n';
    return text;
  };

  const handleDownload = () => {
    const text = generateReceiptText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber}_Receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const text = generateReceiptText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const receiptEl = document.getElementById('printable-receipt');
    const receiptHtml = receiptEl ? receiptEl.innerHTML : '';
    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${invoiceNumber}</title>
          <style>
            @page { margin: 8mm; size: auto; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
              font-size: 11px;
              color: #111;
              margin: 0;
              padding: 10px;
              width: 320px;
            }
            .text-center { text-align: center; }
            .border-b { border-bottom: 1px dashed #666; padding-bottom: 6px; margin-bottom: 6px; }
            .border-t { border-top: 1px dashed #666; padding-top: 6px; margin-top: 6px; }
            .flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .w-1\\/2 { width: 50%; }
            .w-1\\/6 { width: 16.66%; text-align: right; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${receiptHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        console.error('Print error:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1500);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col max-h-[92vh] shadow-xl">
        {/* Action Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex-shrink-0">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Sale Completed Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Area */}
        <div id="printable-receipt" className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
          {/* Store branding */}
          <div className="text-center pb-3 border-b border-dashed border-zinc-300 dark:border-zinc-700">
            <div className="w-9 h-9 mx-auto rounded-none bg-blue-600 text-white flex items-center justify-center font-bold mb-1">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black tracking-tight text-zinc-900 dark:text-white uppercase">
              {store.storeName || 'Corner Mart & Superstore'}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{store.storeAddress || 'Main Market Road'}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Phone: {store.storePhone || '+91 98765 43210'}</p>
          </div>

          {/* Invoice Meta */}
          <div className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400 border-b border-dashed border-zinc-200 dark:border-zinc-700 pb-2">
            <div>
              <p className="font-bold text-zinc-800 dark:text-zinc-200">Invoice: {invoiceNumber}</p>
              <p>Customer: {customerName} {customerPhone ? `(${customerPhone})` : ''}</p>
            </div>
            <div className="text-right">
              <p>{formatDate(date, 'short')}</p>
              <p>{formatDate(date, 'time')}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-1.5 py-1">
            <div className="flex justify-between font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700 pb-1 uppercase tracking-wider text-[10px]">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Price</span>
              <span className="w-1/6 text-right">Total</span>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-zinc-700 dark:text-zinc-300 py-0.5">
                <span className="w-1/2 truncate font-sans text-xs">{item.name}</span>
                <span className="w-1/6 text-center">{item.quantity}</span>
                <span className="w-1/6 text-right">{item.sellingPrice}</span>
                <span className="w-1/6 text-right font-semibold">{item.total}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-2 space-y-1 text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, currency, currencySymbol)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Discount:</span>
                <span>− {formatCurrency(discount, currency, currencySymbol)}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>GST Tax:</span>
                <span>+ {formatCurrency(tax, currency, currencySymbol)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-zinc-900 dark:text-white border-t border-zinc-300 dark:border-zinc-700 pt-1">
              <span>GRAND TOTAL:</span>
              <span className="text-zinc-900 dark:text-white">{formatCurrency(grandTotal, currency, currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
              <span>Payment Mode:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{paymentMethod}</span>
            </div>

            {paymentMethod === 'Cash' && (
              <>
                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(amountTendered, currency, currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Change Given:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatCurrency(changeDue, currency, currencySymbol)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-3 border-t border-dashed border-zinc-300 dark:border-zinc-700 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            <p>Thank you for shopping with us!</p>
            <p>Please visit again.</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-1">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-none bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:translate-y-[1px]"
              title="Print via Thermal Printer"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-none bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:translate-y-[1px]"
              title="Download Digital Invoice Slip (.txt)"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>Slip (.txt)</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-none border font-bold text-xs uppercase tracking-wider transition active:translate-y-[1px] ${
                copied
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-300'
                  : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
              title="Copy text receipt for WhatsApp / SMS"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider border border-blue-700 active:translate-y-[1px] transition ml-auto shadow-sm"
          >
            <span>Next Customer &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;