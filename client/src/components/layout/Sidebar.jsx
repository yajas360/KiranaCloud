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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'POS Counter', to: '/pos', icon: ShoppingCart, highlight: true },
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-52 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 tracking-tight block leading-none">
                StorePulse
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                Retail Terminal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Store Name Banner */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Store</p>
          <p className="text-xs font-bold text-slate-800 truncate" title={storeName}>{storeName}</p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? item.highlight
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : item.highlight
                      ? 'bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive
                          ? item.highlight
                            ? 'text-white'
                            : 'text-emerald-700'
                          : 'text-slate-400'
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
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-50 mb-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 truncate">{user?.name || 'Owner'}</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase">{user?.role || 'Manager'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
