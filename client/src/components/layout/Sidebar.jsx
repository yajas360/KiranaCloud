import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Store,
  ShoppingCart,
  LayoutDashboard,
  Package,
  AlertTriangle,
  Receipt,
  Users,
  Settings,
  LogOut,
  X,
  Circle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navSections = [
  {
    label: 'Terminal',
    items: [
      { name: 'Billing Counter', to: '/pos', icon: ShoppingCart, hotkey: 'F1' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { name: 'Stock Catalog', to: '/inventory', icon: Package, hotkey: 'F2' },
      { name: 'Reorder Sheet', to: '/reorder-sheet', icon: AlertTriangle, hotkey: 'F3' },
    ],
  },
  {
    label: 'Sales & Khata',
    items: [
      { name: 'Sales & Invoices', to: '/invoices', icon: Receipt, hotkey: 'F4' },
      { name: 'Customer Khata', to: '/khata', icon: Users, hotkey: 'F5' },
      { name: 'Store Analytics', to: '/dashboard', icon: LayoutDashboard, hotkey: 'F6' },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { name: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, storeName, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-none lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-48 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-3.5 h-13 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-none bg-blue-600 text-white flex items-center justify-center font-black text-xs font-mono">
              KC
            </div>
            <div>
              <span className="text-xs font-black text-zinc-900 dark:text-white tracking-tight block leading-none">
                KiranaCloud
              </span>
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mt-0.5">
                Terminal v2.4
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-none lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Store Active Banner */}
        <div className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[8px] uppercase font-bold text-zinc-400 tracking-wider">Active Counter</p>
            <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate font-mono" title={storeName}>
              {storeName}
            </p>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Counter Online" />
        </div>

        {/* Categorized Navigation list */}
        <nav className="flex-1 px-2.5 py-3 space-y-3.5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="space-y-0.5">
              <span className="px-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
                {section.label}
              </span>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-1.5 rounded-none text-[11px] font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.hotkey && (
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded-none border ${
                              isActive
                                ? 'border-white/30 text-white/80'
                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500'
                            }`}
                          >
                            {item.hotkey}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Cashier / Staff Profile footer */}
        <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between p-1.5 rounded-none bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <div className="min-w-0 pr-1">
              <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight font-mono">
                {user?.name || 'Cashier'}
              </p>
              <p className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 truncate leading-tight uppercase tracking-wider">
                {user?.role || 'Staff'} • Counter #1
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-none transition flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
