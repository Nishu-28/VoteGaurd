import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Elections from './pages/Elections';
import CandidateRegistration from './pages/CandidateRegistration';
import VoterRegistration from './pages/VoterRegistration';
import VotersList from './pages/VotersList';

const AppContent = () => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}
      <main className={isAuthenticated ? "container mx-auto px-4 py-8" : ""}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AdminLogin />} />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/elections" 
            element={
              <ProtectedRoute>
                <Elections />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/candidate-registration" 
            element={
              <ProtectedRoute>
                <CandidateRegistration />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voter-registration" 
            element={
              <ProtectedRoute>
                <VoterRegistration />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voters-list" 
            element={
              <ProtectedRoute>
                <VotersList />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect based on auth status */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AdminAuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AdminAuthProvider>
  );
};

export default App;
