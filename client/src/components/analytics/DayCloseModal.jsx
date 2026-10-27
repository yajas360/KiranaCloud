import React, { useState, useEffect } from 'react';
import {
  Calculator,
  X,
  CheckCircle,
  AlertTriangle,
  Printer,
  Check,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const DayCloseModal = ({ isOpen, onClose, onClosedSuccess }) => {
  const { currency, currencySymbol, storeName } = useAuth();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [startingFloat, setStartingFloat] = useState('1000');
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successRecord, setSuccessRecord] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setSuccessRecord(null);

      api.get('/analytics/day-close/summary')
        .then((res) => {
          if (res.data.success) {
            const data = res.data.data;
            setSummary(data);
            if (data.existingClose) {
              setStartingFloat(data.existingClose.startingFloat.toString());
              setCountedCash(data.existingClose.countedCash.toString());
              setNotes(data.existingClose.notes || '');
              setSuccessRecord(data.existingClose);
            }
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load day-close summary.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numFloat = Math.max(0, parseFloat(startingFloat) || 0);
  const numCounted = parseFloat(countedCash);
  const isCountedValid = !isNaN(numCounted) && numCounted >= 0;

  const cashSales = summary?.cashSales || 0;
  const khataCollected = summary?.khataCollected || 0;
  const expectedCash = numFloat + cashSales + khataCollected;
  const difference = isCountedValid ? Math.round((numCounted - expectedCash) * 100) / 100 : 0;
  const isMatched = Math.abs(difference) < 0.01;
  const isShortage = difference < -0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isCountedValid) {
      setError('Please enter the actual physical cash counted in your cash drawer.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/analytics/day-close', {
        startingFloat: numFloat,
        countedCash: numCounted,
        notes: notes.trim(),
      });

      if (res.data.success) {
        setSuccessRecord(res.data.data);
        if (onClosedSuccess) onClosedSuccess(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save day-close reconciliation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintZReport = () => {
    const reportData = successRecord || {
      totalRevenue: summary.totalRevenue,
      totalProfit: summary.totalProfit,
      totalBills: summary.totalBills,
      cashSales,
      upiSales: summary.upiSales,
      cardSales: summary.cardSales,
      creditSales: summary.creditSales,
      khataCollected,
      startingFloat: numFloat,
      expectedCash,
      countedCash: numCounted,
      difference,
      status: isMatched ? 'MATCHED' : isShortage ? 'SHORTAGE' : 'SURPLUS',
      notes,
      closedAt: new Date(),
    };

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Z-Report - ${storeName || 'KiranaCloud'}</title>
        <style>
          body { font-family: monospace; width: 300px; margin: 0 auto; padding: 15px; color: #111; font-size: 12px; }
          .header { text-align: center; border-bottom: 1px dashed #444; padding-bottom: 8px; margin-bottom: 10px; }
          .title { font-size: 16px; font-weight: bold; }
          .sub { font-size: 10px; color: #555; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .bold { font-weight: bold; }
          .border-t { border-top: 1px dashed #444; margin-top: 6px; padding-top: 6px; }
          .border-b { border-bottom: 1px dashed #444; margin-bottom: 6px; padding-bottom: 6px; }
          .center { text-align: center; }
          .status { font-size: 13px; font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${storeName || 'KiranaCloud Retail'}</div>
          <div class="sub">DAILY Z-REPORT / REGISTER CLOSE</div>
          <div class="sub">${new Date().toLocaleString()}</div>
        </div>

        <div class="bold">SALES SUMMARY</div>
        <div class="row"><span>Total Bills:</span><span>${reportData.totalBills}</span></div>
        <div class="row"><span>Gross Revenue:</span><span>${currencySymbol}${reportData.totalRevenue.toFixed(2)}</span></div>
        <div class="row"><span>Gross Margin / Profit:</span><span>${currencySymbol}${reportData.totalProfit.toFixed(2)}</span></div>

        <div class="border-t bold">TENDER BREAKDOWN</div>
        <div class="row"><span>Cash Sales:</span><span>${currencySymbol}${reportData.cashSales.toFixed(2)}</span></div>
        <div class="row"><span>UPI Sales:</span><span>${currencySymbol}${reportData.upiSales.toFixed(2)}</span></div>
        <div class="row"><span>Card Sales:</span><span>${currencySymbol}${reportData.cardSales.toFixed(2)}</span></div>
        <div class="row"><span>Khata Credit Sales:</span><span>${currencySymbol}${reportData.creditSales.toFixed(2)}</span></div>
        <div class="row"><span>Khata Cash Recovered:</span><span>${currencySymbol}${reportData.khataCollected.toFixed(2)}</span></div>

        <div class="border-t bold">CASH DRAWER RECONCILIATION</div>
        <div class="row"><span>Starting Cash Float:</span><span>${currencySymbol}${reportData.startingFloat.toFixed(2)}</span></div>
        <div class="row"><span>+ Cash Sales Today:</span><span>${currencySymbol}${reportData.cashSales.toFixed(2)}</span></div>
        <div class="row"><span>+ Khata Cash Collected:</span><span>${currencySymbol}${reportData.khataCollected.toFixed(2)}</span></div>
        <div class="row bold"><span>Expected in Drawer:</span><span>${currencySymbol}${reportData.expectedCash.toFixed(2)}</span></div>
        <div class="row bold border-t"><span>Physical Counted Cash:</span><span>${currencySymbol}${reportData.countedCash.toFixed(2)}</span></div>
        
        <div class="row status ${reportData.difference === 0 ? '' : 'bold'}">
          <span>Discrepancy:</span>
          <span>${reportData.difference >= 0 ? '+' : ''}${currencySymbol}${reportData.difference.toFixed(2)} (${reportData.status})</span>
        </div>

        ${reportData.notes ? `<div class="sub border-t">Notes: ${reportData.notes}</div>` : ''}

        <div class="border-t center sub" style="margin-top: 15px;">
          *** END OF DAY Z-REPORT ***<br/>
          Verified by Manager
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printHtml);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => iframe.remove(), 1000);
      }, 250);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/70 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-none border-2 border-zinc-300 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-blue-600 text-white flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                  Day-Close & Cash Drawer Reconciliation
                </h3>
                {successRecord && (
                  <span className="px-2 py-0.5 rounded-none bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                    ✓ Closed
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                End-of-day register balancing & Z-Report for {storeName || 'KiranaCloud'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12">
            <LoadingSpinner text="Computing register figures for today..." />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="p-4 rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Today's Sales KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-none border-2 border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-400 block tracking-wider">Total Bills</span>
                <span className="text-xl font-black text-zinc-900 dark:text-white mt-0.5 block font-mono">
                  {summary?.totalBills || 0}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Completed today</span>
              </div>
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-none border-2 border-blue-200 dark:border-blue-800/60">
                <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 block tracking-wider">Gross Revenue</span>
                <span className="text-xl font-black text-blue-700 dark:text-blue-400 mt-0.5 block font-mono">
                  {formatCurrency(summary?.totalRevenue || 0, currency, currencySymbol)}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">Total billings</span>
              </div>
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-none border-2 border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block tracking-wider">Gross Profit</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block font-mono">
                  {formatCurrency(summary?.totalProfit || 0, currency, currencySymbol)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Net over cost price</span>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-none border-2 border-zinc-200 dark:border-zinc-700 space-y-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block uppercase tracking-wider">Payment Method Breakdown:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-none border border-zinc-300 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">Cash Sales</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(cashSales, currency, currencySymbol)}
                  </span>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-none border border-zinc-300 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">UPI Transfers</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(summary?.upiSales || 0, currency, currencySymbol)}
                  </span>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-none border border-zinc-300 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">Cards / POS</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(summary?.cardSales || 0, currency, currencySymbol)}
                  </span>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-none border border-zinc-300 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">Khata Given</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(summary?.creditSales || 0, currency, currencySymbol)}
                  </span>
                </div>
              </div>
              {khataCollected > 0 && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1 flex items-center gap-1 font-mono">
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Additional {formatCurrency(khataCollected, currency, currencySymbol)} cash recovered from customer Khata dues today.
                  </span>
                </div>
              )}
            </div>

            {/* Cash Drawer Reconciliation Form */}
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-none border-2 border-zinc-300 dark:border-zinc-700 space-y-3">
              <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Cash Drawer Balancing Calculation</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    Opening Cash Float ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 1000"
                    value={startingFloat}
                    onChange={(e) => setStartingFloat(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block font-medium">
                    Cash in drawer before store opened
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    Actual Counted Cash ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    placeholder="Physical cash counted..."
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border-2 border-blue-600 focus:ring-2 focus:ring-blue-500 font-mono font-black text-base text-zinc-900 dark:text-white bg-blue-50/40 dark:bg-blue-950/40"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block font-medium">
                    Count notes & coins in drawer right now
                  </span>
                </div>
              </div>

              {/* Math Equation Bar */}
              <div className="p-3 rounded-none bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">Expected:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-100 ml-1.5">
                    {formatCurrency(expectedCash, currency, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-sans">
                    (Float {formatCurrency(numFloat, currency, currencySymbol)} + Sales {formatCurrency(cashSales + khataCollected, currency, currencySymbol)})
                  </span>
                </div>

                {isCountedValid && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Status:</span>
                    {isMatched ? (
                      <span className="px-2.5 py-1 rounded-none bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-xs flex items-center gap-1 uppercase tracking-wider">
                        <Check className="w-3.5 h-3.5" />
                        <span>Matched (₹0.00)</span>
                      </span>
                    ) : isShortage ? (
                      <span className="px-2.5 py-1 rounded-none bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-xs flex items-center gap-1 uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Shortage: -{formatCurrency(Math.abs(difference), currency, currencySymbol)}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-none bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center gap-1 uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Surplus: +{formatCurrency(difference, currency, currencySymbol)}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                  Manager Closing Remarks / Shift Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Day shift closed by Manager, ₹50 petty cash spent on cleaning"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-none border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t-2 border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handlePrintZReport}
                disabled={!isCountedValid}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-2 border-zinc-300 dark:border-zinc-700 rounded-none transition uppercase tracking-wider disabled:opacity-40"
              >
                <Printer className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Print Z-Report Slip</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none border-2 border-zinc-300 dark:border-zinc-700 uppercase tracking-wider transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isCountedValid}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-none border border-blue-700 uppercase tracking-wider transition disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : successRecord ? 'Update Z-Report' : 'Confirm & Close Day'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DayCloseModal;