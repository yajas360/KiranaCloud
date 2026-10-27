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
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">StorePulse</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
              >
                <span>Go to Store</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>MERN-Powered Retail Management System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Smart Inventory, Lightning POS & Real-Time Store Profits.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate stockouts, speed up checkout queues, generate clean printable receipts, and track your true daily gross profit margins.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition shadow-lg shadow-emerald-600/25"
            >
              <span>Sign In to Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-700 border border-slate-200 font-bold text-sm hover:bg-slate-50 active:scale-95 transition shadow-sm"
            >
              <span>Create New Store Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interactive Feature Snapshot Preview */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-left space-y-5">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    StorePulse Architecture
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Atomic Stock Deduction & Margin Math</h3>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Full MERN Stack
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Live POS Counter</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Add to cart with real-time stock ceiling validation, instant discount, and GST calculation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Low Stock Engine</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Auto-detects items dropping below safety thresholds and compiles supplier reorder sheets.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-teal-600 font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>True Net Profit</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Calculates exact daily profits: (Selling Price - Cost Price) &times; Units Sold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Built Specifically for Everyday Retail
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Designed to be tested, evaluated, and demonstrated within 60 seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">SKU & Batch Catalog</h4>
                <p className="text-xs text-slate-500">Dual Cost Price vs. Selling Price tracking with unit support.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Printable Invoices</h4>
                <p className="text-xs text-slate-500">Thermal receipt format ready for printing with store header.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Supplier Reorder</h4>
                <p className="text-xs text-slate-500">1-click automated purchase sheet for out-of-stock items.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Customer Khata</h4>
                <p className="text-xs text-slate-500">Digital ledger for customers purchasing on credit.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>StorePulse POS &bull; End-Term Software Engineering Project &bull; Built with MERN Stack</p>
      </footer>
    </div>
  );
};

export default Landing;
