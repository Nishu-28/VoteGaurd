import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Ballot from './pages/Ballot';
import Success from './pages/Success';
import Results from './pages/Results';
import Admin from './pages/Admin';
import CenterSetup from './pages/CenterSetup';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { electionCode: encodedCode } = useParams();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Preserve election code in URL if present
    if (encodedCode) {
      return <Navigate to={`/${encodedCode}/login`} replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  if (requireAdmin && !isAdmin()) {
    // Preserve election code in URL if present
    if (encodedCode) {
      return <Navigate to={`/${encodedCode}/ballot`} replace />;
    } else {
      return <Navigate to="/ballot" replace />;
    }
  }

  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { electionCode: encodedCode } = useParams();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't redirect if this is a vote success message (allow logout)
  const searchParams = new URLSearchParams(location.search);
  const message = searchParams.get('message');
  if (message === 'vote_success') {
    return children;
  }

  if (isAuthenticated()) {
    // Redirect based on role
    if (isAdmin()) {
      return <Navigate to="/admin" replace />;
    } else {
      // Preserve election code in URL if present
      if (encodedCode) {
        return <Navigate to={`/${encodedCode}/ballot`} replace />;
      } else {
        return <Navigate to="/ballot" replace />;
      }
    }
  }

  return children;
};

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

// Main App Component
const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Election-specific routes with election code hash */}
        <Route 
          path="/:electionCode/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        <Route 
          path="/:electionCode/ballot" 
          element={
            <ProtectedRoute>
              <Layout>
                <Ballot />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Legacy routes (for backward compatibility) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        <Route 
          path="/ballot" 
          element={
            <ProtectedRoute>
              <Layout>
                <Ballot />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Center Setup - Public route, accessible to anyone (even if authenticated) */}
        <Route 
          path="/center-setup" 
          element={<CenterSetup />} 
        />

        <Route 
          path="/success" 
          element={
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/results" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <Layout>
                <Results />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/center-setup" replace />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/center-setup" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;