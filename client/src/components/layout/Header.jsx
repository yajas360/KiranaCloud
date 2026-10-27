import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ onOpenSidebar, title = 'KiranaCloud' }) => {
  const { currencySymbol, taxRate } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isPosPage = location.pathname === '/pos';

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-13 px-4 md:px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 text-zinc-500 dark:text-zinc-400 rounded-none lg:hidden hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight uppercase">
            {title}
          </h1>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLINE</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {!isPosPage && (
          <Link
            to="/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:translate-y-[1px] rounded-none border border-blue-700 shadow-sm transition uppercase tracking-wider"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Billing Counter</span>
          </Link>
        )}

        {/* Live Terminal Clock & GST Indicator */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1 rounded-none border border-zinc-200 dark:border-zinc-700 font-mono">
          <span className="text-zinc-500 dark:text-zinc-400">{currentTime}</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span>GST {taxRate}%</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-blue-600 dark:text-blue-400 font-black">{currencySymbol} INR</span>
        </div>

        {/* Dark / Light Mode Palette Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition active:translate-y-[1px]"
          title={theme === 'dark' ? 'Switch to Light Mode (Spring Green)' : 'Switch to Dark Mode (Night Owl)'}
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono font-bold hidden sm:inline uppercase">Night Owl</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-[10px] font-mono font-bold hidden sm:inline uppercase">Spring Green</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
