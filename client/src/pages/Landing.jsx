import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
  Users,
  ArrowRight,
  ShieldCheck,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between transition-colors">
      {/* Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-40 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-none bg-blue-600 text-white flex items-center justify-center font-black text-xs font-mono">
              KC
            </div>
            <div>
              <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">KiranaCloud</span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline ml-1.5 uppercase">POS Terminal</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-none text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-amber-400 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition"
              title={theme === 'dark' ? 'Switch to Light Mode (Spring Green)' : 'Switch to Dark Mode (Night Owl)'}
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-700" />
              )}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-none border border-blue-700 uppercase tracking-wider transition shadow-sm active:translate-y-[1px]"
              >
                <span>Go to Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white uppercase tracking-wider transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-none border border-blue-700 uppercase tracking-wider transition shadow-sm active:translate-y-[1px]"
                >
                  Register Store
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700 uppercase tracking-wider font-mono shadow-sm">
            <span>Built for Modern Indian Retail</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight max-w-3xl mx-auto uppercase">
            Fast Counter Billing, Stock Buffers & True Store Margins.
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate counter queues, prevent inventory stockouts with auto reorder sheets, print clean thermal receipts, and audit actual daily net profits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-none bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-700 border border-blue-700 shadow-sm transition active:translate-y-[1px]"
            >
              <span>Sign In to Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-none bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm transition active:translate-y-[1px]"
            >
              <span>Create Store Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="pt-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-none p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 text-left space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block font-mono">
                    Operational Highlights
                  </span>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase">Instant Checkout & Real-Time Stock Sync</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-none bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider font-mono">
                  Active POS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>POS Counter</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Real-time stock ceiling validation, instant item deduction, and GST calculation.
                  </p>
                </div>

                <div className="p-3.5 rounded-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Reorder Alerts</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Auto-detects items dropping below safety buffers and compiles vendor reorder sheets.
                  </p>
                </div>

                <div className="p-3.5 rounded-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>True Net Profit</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Calculates exact daily profit margins: (Selling Price - Cost Price) &times; Sold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3.5 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
        <p>KiranaCloud Retail Terminal &copy; {new Date().getFullYear()} — Built for High-Volume Store Operations</p>
      </footer>
    </div>
  );
};

export default Landing;
