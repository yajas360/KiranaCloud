import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Package,
  Users,
  CheckCircle2,
  Tag,
  Zap,
} from 'lucide-react';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AIAdvisor = () => {
  const [mode, setMode] = useState('daily'); // 'daily' | 'weekly'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchAdvice = async (selectedMode = mode) => {
    try {
      setLoading(true);
      const res = await api.get(`/ai/advisor?mode=${selectedMode}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch AI advice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice(mode);
  }, [mode]);

  const advice = data?.advice || {};
  const metrics = data?.storeMetrics || {};

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header & Daily/Weekly Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                AI Business Advisor
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ⚡ Gemini 3.5 Flash Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated daily store briefings and weekly retail strategy powered by Google Gemini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Daily vs Weekly Toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setMode('daily')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                mode === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Daily Analysis
            </button>
            <button
              onClick={() => setMode('weekly')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                mode === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Weekly Analysis
            </button>
          </div>

          <button
            onClick={() => fetchAdvice(mode)}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Refresh Analysis"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20">
          <LoadingSpinner text={`Generating live ${mode === 'daily' ? 'Daily Store Brief' : 'Weekly Business Strategy'} with Gemini AI...`} size="md" />
        </div>
      ) : (
        <>
          {/* Gemini Executive Briefing Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                  {mode === 'daily' ? "Today's Executive Briefing" : 'Weekly Executive Strategy'}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {advice.headline || 'Store Operations Status'}
                </h2>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Store Health</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {advice.healthStatus || 'Healthy'} ({advice.healthScore || 85}/100)
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-emerald-500/30 flex items-center justify-center font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
                  {advice.healthScore || 85}%
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {advice.executiveSummary || 'Store operations are performing steadily across counter checkout, inventory reorders, and customer credit collections.'}
            </p>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                  {mode === 'daily' ? 'Revenue Today' : '7-Day Revenue'}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
                  {formatCurrency(mode === 'daily' ? metrics.figures?.today?.revenue : metrics.figures?.week?.revenue)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                  Gross Profit
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
                  {formatCurrency(mode === 'daily' ? metrics.figures?.today?.profit : metrics.figures?.week?.profit)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                  Profit Margin
                </span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5 block font-mono">
                  {mode === 'daily' ? metrics.figures?.today?.marginPercent : metrics.figures?.week?.marginPercent}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                  Completed Bills
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
                  {mode === 'daily' ? metrics.figures?.today?.bills : metrics.figures?.week?.bills}
                </span>
              </div>
            </div>
          </div>

          {/* Grid of Core Actionable Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Margin & Pricing Analysis */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Margin Leakage & Price Tweaks
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    {advice.marginAlerts?.length || 0} Alerts
                  </span>
                </div>

                <div className="space-y-2">
                  {advice.marginAlerts && advice.marginAlerts.length > 0 ? (
                    advice.marginAlerts.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.productName}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.issue}</p>
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          👉 {item.recommendedAction}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      All products currently maintain healthy retail margins.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                <Link
                  to="/inventory"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center justify-between"
                >
                  <span>Update Prices in Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. Priority Stock Reorders */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Priority Reorders
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                    {advice.restockPriorities?.length || 0} Low Stock
                  </span>
                </div>

                <div className="space-y-2">
                  {advice.restockPriorities && advice.restockPriorities.length > 0 ? (
                    advice.restockPriorities.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                          <span>{item.productName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            item.urgency === 'High'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            Order +{item.suggestedQty || 10}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.reason}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      All shelf stock is above minimum safety thresholds.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                <Link
                  to="/reorder-sheet"
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center justify-between"
                >
                  <span>Open Supplier Reorder Sheet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 3. Dead Stock Clearance Plans */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Dead Stock Clearance Strategies
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {advice.deadStockSolutions?.length || 0} Slow Movers
                  </span>
                </div>

                <div className="space-y-2">
                  {advice.deadStockSolutions && advice.deadStockSolutions.length > 0 ? (
                    advice.deadStockSolutions.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.productName}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          💡 {item.strategy}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      No slow-moving inventory detected this period.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                <Link
                  to="/inventory"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-between"
                >
                  <span>Review All Stock Items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 4. Customer Khata Credit & Recovery */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Khata Credit & Recovery
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                    Risk: {advice.khataAdvice?.riskLevel || 'Low'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Total Outstanding Debt:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {formatCurrency(metrics.khata?.totalDebt || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Advance Customer Credit (Surplus):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(metrics.khata?.totalSurplus || 0)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    {advice.khataAdvice?.recommendation || 'Customer debt is balanced.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                <Link
                  to="/khata"
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center justify-between"
                >
                  <span>Open Khata & Send Reminders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 5. Weekly Strategic Growth Initiatives */}
          {advice.growthInitiatives && advice.growthInitiatives.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Strategic Growth Initiatives for this Week
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {advice.growthInitiatives.map((tip, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold inline-flex items-center justify-center mr-2 mb-1">
                      {idx + 1}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed mt-1">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIAdvisor;
