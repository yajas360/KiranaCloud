import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Store Performance & Profit Dashboard',
  '/pos': 'Point of Sale (POS) Billing Counter',
  '/inventory': 'Store Inventory & Stock Levels',
  '/reorder-sheet': 'Low-Stock Supplier Reorder Sheet',
  '/invoices': 'Sales History & Invoice Records',
  '/khata': 'Customer Khata (Credit Ledger)',
  '/settings': 'Store Profile & Tax Settings',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'StorePulse POS';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onOpenSidebar={() => setSidebarOpen(true)} title={title} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
