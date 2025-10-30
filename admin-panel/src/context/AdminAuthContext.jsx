import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const adminSession = localStorage.getItem('adminSession');
      if (adminSession) {
        const sessionData = JSON.parse(adminSession);
        
        // Check if session is still valid
        if (sessionData.expiresAt && new Date(sessionData.expiresAt) > new Date()) {
          setIsAuthenticated(true);
          setAdmin({
            adminId: sessionData.adminId,
            username: sessionData.username,
            role: sessionData.role
          });
          setSession({
            sessionId: sessionData.sessionId,
            expiresAt: sessionData.expiresAt,
            loginMethod: sessionData.loginMethod
          });
        } else {
          // Session expired, clean up
          logout();
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (sessionData) => {
    try {
      // Store session in localStorage
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
      
      // Update state
      setIsAuthenticated(true);
      setAdmin({
        adminId: sessionData.adminId,
        username: sessionData.username,
        role: sessionData.role
      });
      setSession({
        sessionId: sessionData.sessionId,
        expiresAt: sessionData.expiresAt,
        loginMethod: sessionData.loginMethod
      });

      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // If we have an active session, notify the server
      if (session && session.sessionId) {
        try {
          await fetch('http://localhost:8080/api/admin/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: session.sessionId
            }),
          });
        } catch (error) {
          // Server logout failed, but continue with client-side logout
          console.warn('Server logout failed:', error);
        }
      }
    } finally {
      // Clean up client-side state regardless of server response
      localStorage.removeItem('adminSession');
      setIsAuthenticated(false);
      setAdmin(null);
      setSession(null);
    }
  };

  const refreshSession = async () => {
    try {
      if (!session || !session.sessionId) {
        return false;
      }

      const response = await fetch('http://localhost:8080/api/admin/session/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.sessionId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update session with new expiry
          const updatedSession = {
            ...session,
            expiresAt: result.expiresAt
          };
          
          const fullSessionData = {
            sessionId: session.sessionId,
            adminId: admin.adminId,
            username: admin.username,
            role: admin.role,
            expiresAt: result.expiresAt,
            loginMethod: session.loginMethod
          };

          localStorage.setItem('adminSession', JSON.stringify(fullSessionData));
          setSession(updatedSession);
          return true;
        }
      }
      
      // Session refresh failed, logout
      logout();
      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      logout();
      return false;
    }
  };

  const hasRole = (requiredRole) => {
    if (!admin || !admin.role) return false;
    
    // Role hierarchy: SUPER_ADMIN > ADMIN
    const roleHierarchy = {
      'SUPER_ADMIN': 2,
      'ADMIN': 1
    };
    
    const userRoleLevel = roleHierarchy[admin.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  // Auto-refresh session before it expires
  useEffect(() => {
    if (!isAuthenticated || !session) return;

    const checkSessionExpiry = () => {
      if (session.expiresAt) {
        const expiryTime = new Date(session.expiresAt).getTime();
        const currentTime = new Date().getTime();
        const timeUntilExpiry = expiryTime - currentTime;
        
        // Refresh session 5 minutes before expiry
        if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
          refreshSession();
        } else if (timeUntilExpiry <= 0) {
          logout();
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, session]);

  const value = {
    isAuthenticated,
    admin,
    session,
    loading,
    login,
    logout,
    refreshSession,
    hasRole,
    checkExistingSession
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;