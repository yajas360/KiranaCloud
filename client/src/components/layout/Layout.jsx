import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/dashboard': 'Store Performance & Profit',
  '/pos': 'Billing Counter',
  '/inventory': 'Stock Inventory',
  '/reorder-sheet': 'Low-Stock Reorder Sheet',
  '/invoices': 'Invoice History',
  '/khata': 'Customer Khata (Credit)',
  '/settings': 'Store Settings',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'KiranaCloud POS';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors">
      {/* Slim Compact Left Sidebar (width: 44 / 176px) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area - Maximized Full-Frame Space */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-44">
        <Header onOpenSidebar={() => setSidebarOpen(true)} title={title} />

        <main className="flex-1 p-3 md:p-4 w-full max-w-[1600px] mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
