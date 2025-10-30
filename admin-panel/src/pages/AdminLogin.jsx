import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, CheckCircle, User, Lock } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import FingerprintUploader from '../components/FingerprintUploader';
import Button from '../components/Button';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    adminId: '',
    fallbackCode: ''
  });
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [loginMethod, setLoginMethod] = useState('biometric'); // 'biometric' or 'fallback'
  
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  // Note: Authentication checking is handled by AdminAuthContext
  // No need for useEffect here to prevent infinite re-renders

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleFingerprintVerification = (verified, file) => {
    setFingerprintVerified(verified);
    setFingerprintFile(file);
    if (!verified) {
      setError('Fingerprint verification failed. Please try again or use fallback authentication.');
    } else {
      setError('');
    }
  };

  const handleBiometricLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.adminId.trim()) {
      setError('Please enter your Admin ID.');
      return;
    }

    if (!fingerprintVerified || !fingerprintFile) {
      setError('Please verify your fingerprint first.');
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart request
      const loginData = new FormData();
      loginData.append('adminId', formData.adminId.trim());
      loginData.append('fingerprint', fingerprintFile); // Backend expects 'fingerprint'

      const response = await fetch('http://localhost:8080/api/admin/login', {
        method: 'POST',
        body: loginData,
      });

      let result;
      const responseText = await response.text();
      
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        console.error('Response text:', responseText);
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      if (response.ok && result.success) {
        // Store session information using context
        const sessionData = {
          token: result.token, // JWT token for authentication
          sessionId: result.sessionId,
          adminId: result.admin.adminId,
          username: result.admin.username,
          role: result.admin.role,
          expiresAt: result.expiresAt,
          loginMethod: 'BIOMETRIC'
        };

        // Use context login method which handles state and localStorage
        if (login(sessionData)) {
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          setError('Failed to establish session. Please try again.');
        }
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
        
        // If biometric login fails, suggest fallback
        if (result.code === 'BIOMETRIC_VERIFICATION_FAILED') {
          setShowFallback(true);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login service is currently unavailable. Please try again later.');
      setShowFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFallbackLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.adminId.trim() || !formData.fallbackCode.trim()) {
      setError('Please enter both Admin ID and fallback code.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/admin/login/fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: formData.adminId.trim(),
          fallbackCode: formData.fallbackCode.trim(),
          loginMethod: 'FALLBACK'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store session information using context
        const sessionData = {
          sessionId: result.sessionId,
          adminId: result.admin.adminId,
          username: result.admin.username,
          role: result.admin.role,
          expiresAt: result.expiresAt,
          loginMethod: 'FALLBACK'
        };

        // Use context login method which handles state and localStorage
        if (login(sessionData)) {
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          setError('Failed to establish session. Please try again.');
        }
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Fallback login error:', error);
      setError('Login service is currently unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-3xl font-bold text-gray-900 dark:text-white"
          >
            VoteGuard Admin
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            Secure Admin Access with Biometric Authentication
          </motion.p>
        </div>

        {/* Login Method Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
        >
          {/* Method Toggle */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginMethod('biometric')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'biometric'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Biometric Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('fallback')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'fallback'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Fallback Access
            </button>
          </div>

          {/* Biometric Login Form */}
          {loginMethod === 'biometric' && (
            <form onSubmit={handleBiometricLogin} className="space-y-6">
              {/* Admin ID */}
              <div>
                <label htmlFor="adminId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="adminId"
                    name="adminId"
                    type="text"
                    required
                    value={formData.adminId}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your Admin ID"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Fingerprint Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fingerprint Authentication
                </label>
                <FingerprintUploader
                  onVerificationComplete={handleFingerprintVerification}
                  disabled={isLoading}
                  mode="verify"
                  voterId={formData.adminId || 'ADMIN_AUTH'}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={!fingerprintVerified || !formData.adminId.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? 'Authenticating...' : 'Login with Biometric'}
              </Button>
            </form>
          )}

          {/* Fallback Login Form */}
          {loginMethod === 'fallback' && (
            <form onSubmit={handleFallbackLogin} className="space-y-6">
              {/* Admin ID */}
              <div>
                <label htmlFor="adminId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="adminId"
                    name="adminId"
                    type="text"
                    required
                    value={formData.adminId}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your Admin ID"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Fallback Code */}
              <div>
                <label htmlFor="fallbackCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emergency Access Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="fallbackCode"
                    name="fallbackCode"
                    type="password"
                    required
                    value={formData.fallbackCode}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter emergency access code"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                loading={isLoading}
                disabled={!formData.adminId.trim() || !formData.fallbackCode.trim()}
                className="w-full"
              >
                {isLoading ? 'Authenticating...' : 'Login with Fallback'}
              </Button>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Fallback Suggestion */}
          {showFallback && loginMethod === 'biometric' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Having trouble with biometric authentication? Try using the{' '}
                <button
                  type="button"
                  onClick={() => setLoginMethod('fallback')}
                  className="underline hover:no-underline font-medium"
                >
                  Fallback Access
                </button>{' '}
                method.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Demo: Use ADMIN001 for testing (Emergency code: EMERGENCY2025)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Secure admin access with multi-factor authentication
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;