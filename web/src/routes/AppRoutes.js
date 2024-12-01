import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginSignupScreen from '../components/LoginSignupScreen';
import BossDashboard from '../components/BossDashboard';
import AssociateDashboard from '../components/AssociateDashboard';
import Navigation from '../components/Navigation';
import Stock from '../components/Stock';
import StockList from '../components/StockList';
import Sales from '../components/Sales';

const PrivateRoute = ({ children, allowedRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <Navigate to="/" />;
  }

  if (allowedRole && profile.role !== allowedRole) {
    return <Navigate to={profile.role === 'boss' ? '/boss-dashboard' : '/associate-dashboard'} />;
  }

  return (
    <>
      <Navigation />
      {children}
    </>
  );
};

const AppRoutes = () => {
  const { user, profile } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                profile?.role === 'boss'
                  ? '/boss-dashboard'
                  : '/associate-dashboard'
              }
            />
          ) : (
            <LoginSignupScreen />
          )
        }
      />

      <Route
        path="/boss-dashboard"
        element={
          <PrivateRoute allowedRole="boss">
            <BossDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/associate-dashboard"
        element={
          <PrivateRoute allowedRole="associate">
            <AssociateDashboard />
          </PrivateRoute>
        }
      />

      {/* Stock Routes */}
      <Route
        path="/stock/record"
        element={
          <PrivateRoute>
            <Stock />
          </PrivateRoute>
        }
      />

      <Route
        path="/stock/list"
        element={
          <PrivateRoute>
            <StockList />
          </PrivateRoute>
        }
      />

      {/* Sales Routes */}
      <Route
        path="/sales/:duration"
        element={
          <PrivateRoute>
            <Sales />
          </PrivateRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
