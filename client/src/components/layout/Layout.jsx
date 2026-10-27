import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Store Performance & Profit',
  '/pos': 'POS Billing Terminal',
  '/inventory': 'Stock Inventory',
  '/reorder-sheet': 'Low-Stock Reorder Sheet',
  '/invoices': 'Invoice History',
  '/khata': 'Customer Khata (Credit)',
  '/settings': 'Store Settings',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'StorePulse POS';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Compact Left Sidebar (width: 52 / 208px) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area - Maximized Space for the Right */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-52">
        <Header onOpenSidebar={() => setSidebarOpen(true)} title={title} />

        <main className="flex-1 p-4 md:p-6 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
