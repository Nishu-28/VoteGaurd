import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [election, setElection] = useState(() => {
    const stored = localStorage.getItem('election');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Decode JWT token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          voterId: payload.sub,
          role: payload.role,
          exp: payload.exp
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = (token, userData, fingerprintFile = null) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser({
      ...userData,
      fingerprintFile: fingerprintFile
    });
  };
  
  const setElectionContext = (electionData) => {
    localStorage.setItem('election', JSON.stringify(electionData));
    setElection(electionData);
  };
  
  const clearElection = () => {
    localStorage.removeItem('election');
    setElection(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('election');
    setToken(null);
    setUser(null);
    setElection(null);
  };

  const isAuthenticated = () => {
    if (!token || !user) return false;
    
    // Check if token is expired
    const now = Date.now() / 1000;
    return user.exp > now;
  };

  const isAdmin = () => {
    return user && user.role === 'ADMIN';
  };

  const value = {
    user,
    token,
    election,
    setElectionContext,
    clearElection,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

