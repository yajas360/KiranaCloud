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
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'POS Billing Counter', to: '/pos', icon: ShoppingCart, highlight: true },
  { name: 'Dashboard & Profit', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory Catalog', to: '/inventory', icon: Package },
  { name: 'Supplier Reorder Sheet', to: '/reorder-sheet', icon: AlertTriangle },
  { name: 'Sales & Invoices', to: '/invoices', icon: Receipt },
  { name: 'Customer Khata (Credit)', to: '/khata', icon: Users },
  { name: 'Store Settings', to: '/settings', icon: Settings },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight">StorePulse</span>
              <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                Retail & POS System
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store banner */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Store</p>
          <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{storeName}</p>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? item.highlight
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-700'
                      : item.highlight
                      ? 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? item.highlight
                            ? 'text-white'
                            : 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Owner'}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">{user?.role || 'Store Owner'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
