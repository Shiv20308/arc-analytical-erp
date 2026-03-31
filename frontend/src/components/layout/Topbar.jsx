import React from 'react';
import { useLocation } from 'react-router-dom';

const titleMap = {
  '/': 'Dashboard',
  '/clients': 'Client Management',
  '/contracts': 'AMC/CMC Contracts',
  '/visits': 'Service Visits',
  '/quotations': 'Quotations',
  '/invoices': 'Invoices',
  '/purchase-orders': 'Purchase Orders',
  '/followups': 'Follow-up Management',
  '/settings': 'Company Settings',
};

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const title = Object.entries(titleMap).find(([path]) => pathname === path || pathname.startsWith(path + '/'))?.[1] || 'Arc Analytical ERP';

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-gray-400 hidden sm:block">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </header>
  );
}
