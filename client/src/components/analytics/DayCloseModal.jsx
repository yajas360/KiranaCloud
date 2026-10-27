import React, { useState, useEffect } from 'react';
import {
  Calculator,
  X,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Printer,
  Calendar,
  Check,
  Receipt,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/axios';
import { formatCurrency, formatDate } from '../../utils/formatters';
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
  const isSurplus = difference > 0.01;

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
        <title>Z-Report - ${storeName || 'StorePulse'}</title>
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
          <div class="title">${storeName || 'StorePulse Retail'}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Day-Close & Cash Drawer Reconciliation
                </h3>
                {successRecord && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Closed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                End-of-day register balancing & Z-Report for {storeName || 'StorePulse'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
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
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Today's Sales KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bills</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block font-mono">
                  {summary?.totalBills || 0}
                </span>
                <span className="text-[10px] text-slate-400">Completed today</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Gross Revenue</span>
                <span className="text-xl font-black text-emerald-700 mt-0.5 block font-mono">
                  {formatCurrency(summary?.totalRevenue || 0, currency, currencySymbol)}
                </span>
                <span className="text-[10px] text-emerald-600">Total billings</span>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-[10px] uppercase font-bold text-purple-800 block">Gross Profit</span>
                <span className="text-xl font-black text-purple-700 mt-0.5 block font-mono">
                  {formatCurrency(summary?.totalProfit || 0, currency, currencySymbol)}
                </span>
                <span className="text-[10px] text-purple-600">Net over cost price</span>
              </div>
            </div>

            {/* Payment Method Breakdown Pills */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Payment Method Breakdown:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Cash Sales</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(cashSales, currency, currencySymbol)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">UPI Transfers</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(summary?.upiSales || 0, currency, currencySymbol)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Cards / POS</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(summary?.cardSales || 0, currency, currencySymbol)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Khata Given</span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatCurrency(summary?.creditSales || 0, currency, currencySymbol)}
                  </span>
                </div>
              </div>
              {khataCollected > 0 && (
                <div className="text-[11px] text-emerald-700 font-semibold pt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Additional {formatCurrency(khataCollected, currency, currencySymbol)} cash recovered from customer Khata dues today.
                  </span>
                </div>
              )}
            </div>

            {/* Cash Drawer Reconciliation Form */}
            <div className="p-4 bg-white rounded-xl border border-slate-300 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash Drawer Balancing Calculation</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Opening Cash Float ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 1000"
                    value={startingFloat}
                    onChange={(e) => setStartingFloat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Cash in drawer before store opened
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 font-mono font-black text-base text-slate-900 bg-emerald-50/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Count notes & coins in drawer right now
                  </span>
                </div>
              </div>

              {/* Math Equation Bar */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500">Expected:</span>
                  <span className="font-bold text-slate-800 ml-1.5">
                    {formatCurrency(expectedCash, currency, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    (Float {formatCurrency(numFloat, currency, currencySymbol)} + Sales {formatCurrency(cashSales + khataCollected, currency, currencySymbol)})
                  </span>
                </div>

                {isCountedValid && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-sans font-bold">Status:</span>
                    {isMatched ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Matched (₹0.00)</span>
                      </span>
                    ) : isShortage ? (
                      <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Shortage: -{formatCurrency(Math.abs(difference), currency, currencySymbol)}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Surplus: +{formatCurrency(difference, currency, currencySymbol)}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manager Closing Remarks / Shift Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Day shift closed by Manager, ₹50 petty cash spent on cleaning"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrintZReport}
                disabled={!isCountedValid}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition disabled:opacity-40"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Z-Report Slip</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isCountedValid}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm transition disabled:opacity-40"
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
