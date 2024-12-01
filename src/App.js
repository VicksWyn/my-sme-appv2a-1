import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

// Layout Components
import NavBar from './components/layout/NavBar';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AssociateOnboarding from './components/auth/AssociateOnboarding';
import AssociateRegistration from './components/auth/AssociateRegistration';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard Components
import BossDashboard from './components/dashboard/BossDashboard';
import AssociateDashboard from './components/dashboard/AssociateDashboard';

// Sales Components
import Sales from './components/sales/Sales';
import RecordSale from './components/sales/RecordSale';
import SalesHistory from './components/sales/SalesHistory';
import SalesReports from './components/sales/SalesReports';

// Stock Components
import Stock from './components/stock/Stock';

function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <NavBar />
            <div className="pt-16">
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={<Login />}
                />
                <Route
                  path="/register"
                  element={<Register />}
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route
                  path="/associate-onboarding"
                  element={
                    <ProtectedRoute>
                      <AssociateOnboarding />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/boss"
                  element={
                    <ProtectedRoute requiredRole="boss">
                      <BossDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/associate"
                  element={
                    <ProtectedRoute requiredRole="associate">
                      <AssociateDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/associate-registration"
                  element={
                    <ProtectedRoute requiredRole="boss">
                      <AssociateRegistration />
                    </ProtectedRoute>
                  }
                />

                {/* Sales Routes */}
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <Sales />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/record"
                  element={
                    <ProtectedRoute>
                      <RecordSale />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/history"
                  element={
                    <ProtectedRoute>
                      <SalesHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/reports"
                  element={
                    <ProtectedRoute>
                      <SalesReports />
                    </ProtectedRoute>
                  }
                />

                {/* Stock Routes */}
                <Route
                  path="/stock"
                  element={
                    <ProtectedRoute>
                      <Stock />
                    </ProtectedRoute>
                  }
                />

                {/* Default Route */}
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </SessionContextProvider>
  );
}

export default App;
