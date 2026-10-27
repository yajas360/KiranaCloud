import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Store,
  ShoppingCart,
  LayoutDashboard,
  Sparkles,
  Package,
  AlertTriangle,
  Receipt,
  Users,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Billing Counter', to: '/pos', icon: ShoppingCart },
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Advisor', to: '/ai-advisor', icon: Sparkles },
  { name: 'Inventory', to: '/inventory', icon: Package },
  { name: 'Reorder Sheet', to: '/reorder-sheet', icon: AlertTriangle },
  { name: 'Sales & Invoices', to: '/invoices', icon: Receipt },
  { name: 'Customer Khata', to: '/khata', icon: Users },
  { name: 'Settings', to: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, storeName, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-44 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-3 h-13 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight block leading-none">
                KiranaCloud
              </span>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-0.5">
                Retail Terminal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md lg:hidden"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Store Name Banner */}
        <div className="px-3 py-2 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Store</p>
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={storeName}>{storeName}</p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-2 py-2.5 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-1 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/80 mb-1.5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name || 'Owner'}</p>
              <p className="text-[8px] text-slate-400 font-semibold uppercase">{user?.role || 'Manager'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
