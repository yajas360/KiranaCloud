import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  TrendingDown,
  Calculator,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DayCloseModal from '../components/analytics/DayCloseModal';

const DONUT_COLORS = ['#059669', '#2563eb', '#d97706', '#db2777', '#7c3aed', '#0891b2', '#ea580c'];

const Dashboard = () => {
  const { currency, currencySymbol } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/metrics');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard metrics..." size="md" />;
  }

  const {
    today = {},
    inventoryHealth = {},
    last7DaysTrend = [],
    categoryBreakdown = [],
    topProducts = [],
    recentSales = [],
  } = metrics || {};

  return (
    <div className="space-y-5">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Retail Performance Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Live overview of sales, profit margins, inventory health, and register balance.</p>
        </div>
        <button
          onClick={() => setIsDayCloseOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition self-start sm:self-auto"
          title="End of day register balancing and Z-Report"
        >
          <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Day-Close (Z-Report)</span>
        </button>
      </div>

      {/* Low Stock Urgent Warning Banner */}
      {inventoryHealth.lowStockCount > 0 && (
        <div className="px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {inventoryHealth.lowStockCount} items below safety threshold
              {inventoryHealth.outOfStockCount > 0 && ` (${inventoryHealth.outOfStockCount} out of stock)`}
            </p>
          </div>
          <Link
            to="/reorder-sheet"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800/80 rounded-xl transition"
          >
            <span>Open Reorder Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Gross Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(today.revenue, currency, currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Gross cash & online sales</p>
          </div>
        </div>

        {/* Today's Net Profit */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Profit</span>
            <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {today.marginPercentage}% Margin
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {formatCurrency(today.netProfit, currency, currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Selling Price − Wholesale Cost</p>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Invoices</span>
            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {today.billsCount || 0}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Checkout receipts today</p>
          </div>
        </div>

        {/* Inventory Stock Health */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Health</span>
            <Package className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {inventoryHealth.totalProducts || 0} <span className="text-xs font-normal text-slate-400">SKUs</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{inventoryHealth.healthyCount} OK</span>
              {' • '}
              <span className="text-amber-700 dark:text-amber-400 font-bold">{inventoryHealth.lowStockCount} Low</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 7-Day Performance */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">7-Day Sales vs. Net Profit</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Comparing gross revenue against wholesale product cost</p>
            </div>
            <Link
              to="/pos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Billing Counter</span>
            </Link>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value, currency, currencySymbol),
                    name === 'revenue' ? 'Sales Revenue' : 'Net Profit',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="revenue" name="Sales Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Category Revenue</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sales distribution across catalog</p>
          </div>

          <div className="h-64 w-full">
            {categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                No category sales recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="revenue"
                    nameKey="category"
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val, currency, currencySymbol), 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Dense Data Tables: Top Bestsellers & Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Bestsellers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Top-Selling Products</h3>
            <Link to="/inventory" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
              Inventory
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No sales logged yet to rank products.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{p.sku}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white block">{p.totalUnitsSold} units</span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      {formatCurrency(p.totalRevenue, currency, currencySymbol)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Recent Invoices</h3>
            <Link to="/invoices" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
              All Invoices
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSales.map((sale) => (
                <div key={sale._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{sale.invoiceNumber}</span>
                    <span className="text-slate-400 dark:text-slate-500 ml-1.5">• {sale.customerName}</span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {formatDate(sale.date, 'time')} • {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right font-mono flex-shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {formatCurrency(sale.grandTotal, currency, currencySymbol)}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      +{formatCurrency(sale.netProfit, currency, currencySymbol)} profit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Day Close / Z-Report Modal */}
      <DayCloseModal
        isOpen={isDayCloseOpen}
        onClose={() => setIsDayCloseOpen(false)}
        onClosedSuccess={() => fetchMetrics()}
      />
    </div>
  );
};

export default Dashboard;
