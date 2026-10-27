import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ onOpenSidebar, title = 'KiranaCloud' }) => {
  const { currencySymbol, taxRate } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isPosPage = location.pathname === '/pos';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 text-slate-500 dark:text-slate-400 rounded-lg lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
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
            <span>Billing Counter</span>
          </Link>
        )}

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>GST: {taxRate}%</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>{currencySymbol} INR</span>
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-amber-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
