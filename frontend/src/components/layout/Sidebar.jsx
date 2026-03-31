import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/clients', icon: '🏢', label: 'Clients' },
  { path: '/contracts', icon: '📋', label: 'AMC/CMC Contracts' },
  { path: '/visits', icon: '🔧', label: 'Service Visits' },
  { path: '/quotations', icon: '📄', label: 'Quotations' },
  { path: '/invoices', icon: '🧾', label: 'Invoices' },
  { path: '/purchase-orders', icon: '📦', label: 'Purchase Orders' },
  { path: '/followups', icon: '📞', label: 'Follow-ups' },
];

const adminItems = [
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400 hover:bg-white/10 hover:text-white'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-xl font-bold">A</div>
          <div>
            <div className="font-bold text-sm leading-tight">Arc Analytical</div>
            <div className="text-xs text-gray-400">ERP System</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-500 px-4 py-2 uppercase tracking-wider">Main Menu</div>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'} className={linkClass} onClick={onClose}>
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="text-xs font-semibold text-gray-500 px-4 py-2 mt-4 uppercase tracking-wider">Administration</div>
            {adminItems.map(item => (
              <NavLink key={item.path} to={item.path} className={linkClass} onClick={onClose}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors" title="Logout">↪</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:z-30">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-60 z-50">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
