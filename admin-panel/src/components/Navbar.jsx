import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      navigate('/login');
    }
  };

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-white" />
            <h1 className="text-xl font-bold text-white">VoteGuard Admin Panel</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Navigation Links */}
            <div className="flex space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/elections"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/elections')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                Elections
              </Link>
              <Link
                to="/candidate-registration"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/candidate-registration')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                Candidates
              </Link>
              <Link
                to="/voter-registration"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/voter-registration')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                Register Voter
              </Link>
              <Link
                to="/voters-list"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/voters-list')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                Voters List
              </Link>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 hover:text-white transition-colors"
              >
                <User className="h-4 w-4" />
                <span>{admin?.username || admin?.adminId}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{admin?.username}</p>
                    <p className="text-xs text-gray-500">{admin?.adminId}</p>
                    <p className="text-xs text-blue-600">{admin?.role}</p>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;