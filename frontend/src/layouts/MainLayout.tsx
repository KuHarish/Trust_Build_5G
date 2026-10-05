import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ToastNotificationContainer } from '@/components/common';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Mobile backdrop overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-slate-950/80 backdrop-blur-xs z-10 md:hidden"
            aria-hidden="true"
          />
        )}

        {/* Main interactive content workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Persistent global toast notification anchor */}
      <ToastNotificationContainer />
    </div>
  );
};
