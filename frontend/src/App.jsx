import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Contracts from './pages/Contracts';
import Visits from './pages/Visits';
import Quotations from './pages/Quotations';
import Invoices from './pages/Invoices';
import PurchaseOrders from './pages/PurchaseOrders';
import FollowUps from './pages/FollowUps';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Loading Arc Analytical ERP...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="visits" element={<Visits />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="followups" element={<FollowUps />} />
        <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '10px', background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#f8fafc' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
