import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, Plus, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onOpenSidebar, title = 'StorePulse' }) => {
  const { storeName, currencySymbol, taxRate } = useAuth();
  const location = useLocation();
  const isPosPage = location.pathname === '/pos';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isPosPage && (
          <Link
            to="/pos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS Counter</span>
          </Link>
        )}

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GST: {taxRate}%</span>
          <span className="text-slate-300">|</span>
          <span>{currencySymbol} INR</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
