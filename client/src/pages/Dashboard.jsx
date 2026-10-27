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
  Calculator,
  ArrowUpRight,
  Sparkles,
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
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DayCloseModal from '../components/analytics/DayCloseModal';

const DONUT_COLORS_LIGHT = ['#006148', '#22763A', '#448526', '#669413', '#88A300', '#95A700', '#A30508'];
const DONUT_COLORS_DARK = ['#4A5C65', '#5A707B', '#5EC89E', '#D4AD66', '#91A7B4', '#6E8694', '#C4363B'];

const Dashboard = () => {
  const { currency, currencySymbol } = useAuth();
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);

  const isDark = theme === 'dark';
  const donutColors = isDark ? DONUT_COLORS_DARK : DONUT_COLORS_LIGHT;
  const primaryBarColor = isDark ? '#4A5C65' : '#006148';
  const secondaryBarColor = isDark ? '#5EC89E' : '#22763A';

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
    <div className="space-y-4">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">
            Store Performance & Gross Margin
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time sales revenue, wholesale gross margins, inventory safety alerts, and register balance.
          </p>
        </div>
        <button
          onClick={() => setIsDayCloseOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none transition self-start sm:self-auto uppercase tracking-wider shadow-sm active:translate-y-[1px]"
          title="End of day register balancing and Z-Report"
        >
          <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Day-Close Register</span>
        </button>
      </div>

      {/* Low Stock Urgent Warning Banner */}
      {inventoryHealth.lowStockCount > 0 && (
        <div className="px-3.5 py-2.5 rounded-none bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              {inventoryHealth.lowStockCount} items below safety threshold
              {inventoryHealth.outOfStockCount > 0 && ` (${inventoryHealth.outOfStockCount} out of stock)`}
            </p>
          </div>
          <Link
            to="/reorder-sheet"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-950 dark:text-amber-200 bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800/80 rounded-none border border-amber-300 dark:border-amber-700 uppercase tracking-wider transition"
          >
            <span>Review Reorder Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Gross Sales */}
        <div className="p-3.5 rounded-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Sales</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {formatCurrency(today.revenue, currency, currencySymbol)}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Gross counter turnover</p>
          </div>
        </div>

        {/* Today's Net Profit */}
        <div className="p-3.5 rounded-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Gross Margin</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.2 border border-emerald-300 dark:border-emerald-700">
              {today.marginPercentage}%
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {formatCurrency(today.profit, currency, currencySymbol)}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">(Selling Price - Cost Price) &times; Sold</p>
          </div>
        </div>

        {/* Total Invoices Today */}
        <div className="p-3.5 rounded-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bills Generated</span>
            <Receipt className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {today.saleCount || 0}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Checkout receipts today</p>
          </div>
        </div>

        {/* Inventory Stock Health */}
        <div className="p-3.5 rounded-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Health</span>
            <Package className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {inventoryHealth.totalProducts || 0} <span className="text-xs font-normal text-zinc-400">SKUs</span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{inventoryHealth.healthyCount} OK</span>
              {' • '}
              <span className="text-amber-700 dark:text-amber-400 font-bold">{inventoryHealth.lowStockCount} Low</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* 7-Day Performance */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-none p-4 md:p-5 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
                7-Day Sales vs. Net Margin
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Comparing gross revenue against wholesale product cost</p>
            </div>
            <Link
              to="/pos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 uppercase tracking-wider transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Billing Counter</span>
            </Link>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={isDark ? '#323638' : '#CBD8CF'} opacity={0.6} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDark ? '#8D9FA8' : '#566E60' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#8D9FA8' : '#566E60' }} tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value, currency, currencySymbol),
                    name === 'revenue' ? 'Sales Revenue' : 'Net Profit',
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? '#1A1C1D' : '#FFFFFF',
                    borderRadius: '0px',
                    border: `1px solid ${isDark ? '#323638' : '#CBD8CF'}`,
                    color: isDark ? '#F0F4F8' : '#0C1D15',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend iconType="square" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="revenue" name="Sales Revenue" fill={primaryBarColor} radius={[0, 0, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill={secondaryBarColor} radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-none p-4 md:p-5 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <div>
            <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">Category Revenue</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Sales distribution across catalog</p>
          </div>

          <div className="h-64 w-full">
            {categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
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
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val, currency, currencySymbol), 'Revenue']}
                    contentStyle={{
                      backgroundColor: isDark ? '#1A1C1D' : '#FFFFFF',
                      borderRadius: '0px',
                      border: `1px solid ${isDark ? '#323638' : '#CBD8CF'}`,
                      color: isDark ? '#F0F4F8' : '#0C1D15',
                      fontSize: '11px',
                    }}
                  />
                  <Legend iconType="square" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Day Close Modal */}
      <DayCloseModal
        isOpen={isDayCloseOpen}
        onClose={() => setIsDayCloseOpen(false)}
        metrics={metrics}
      />
    </div>
  );
};

export default Dashboard;
