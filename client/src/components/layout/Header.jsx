import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onOpenSidebar, title = 'StorePulse' }) => {
  const { currencySymbol, taxRate } = useAuth();
  const location = useLocation();
  const isPosPage = location.pathname === '/pos';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-white border-b border-slate-200/90">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        {!isPosPage && (
          <Link
            to="/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>POS Counter</span>
          </Link>
        )}

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>GST: {taxRate}%</span>
          <span className="text-slate-300">|</span>
          <span>{currencySymbol} INR</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
