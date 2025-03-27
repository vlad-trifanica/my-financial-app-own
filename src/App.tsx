import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Debts from './pages/Debts';
import NetWorth from './pages/NetWorth';
import Login from './pages/Login';
import Layout from './components/layout/MainLayout.tsx';
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// App component with authentication
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

// AppRoutes component to handle routing
const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Protected routes logic
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if user is authenticated and tries to access login
  if (user && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <Layout>
          <Dashboard />
        </Layout>
      } />
      <Route path="/assets" element={
        <Layout>
          <Assets />
        </Layout>
      } />
      <Route path="/debts" element={
        <Layout>
          <Debts />
        </Layout>
      } />
      <Route path="/net-worth" element={
        <Layout>
          <NetWorth />
        </Layout>
      } />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;