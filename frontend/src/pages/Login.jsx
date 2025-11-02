import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import { electionService } from '../services/election';
import FingerprintUploader from '../components/FingerprintUploader';
import Button from '../components/Button';
import { Shield, AlertCircle, CheckCircle, Vote } from 'lucide-react';
import { decodeElectionCode } from '../utils/electionCode';

const Login = () => {
  const [formData, setFormData] = useState({
    voterId: '',
    extraField: ''
  });
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { electionCode: encodedCode } = useParams(); // Get encoded election code from URL
  const [searchParams] = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  
  // Debug: Log the encoded code from URL
  React.useEffect(() => {
    console.log('Login page - encodedCode from URL:', encodedCode);
  }, [encodedCode]);
  
  // Decode the election code from URL
  const electionCode = encodedCode ? decodeElectionCode(encodedCode) : null;

  useEffect(() => {
    // Check for messages from URL
    const message = searchParams.get('message');
    
    // If this is a vote success redirect, don't redirect back to ballot even if authenticated
    if (message === 'vote_success') {
      setSuccessMessage('Your vote has been cast successfully! Ready for the next voter.');
      // Don't redirect - stay on login page
      return;
    }
    
    if (isAuthenticated()) {
      // Always redirect to encoded ballot URL if encodedCode is present in URL
      if (encodedCode) {
        console.log('Auto-redirect (already authenticated) to:', `/${encodedCode}/ballot`);
        navigate(`/${encodedCode}/ballot`, { replace: true });
      } else {
        navigate('/ballot', { replace: true });
      }
    }
    
    // Handle other messages
    if (message === 'session_expired') {
      setError('Your session has expired. Please sign in again to continue voting.');
    } else if (message === 'already_voted') {
      setError('You have already cast your vote. Thank you for participating!');
    }
    
    // Validate election code if present
    if (encodedCode && !electionCode) {
      setError('Invalid election code in URL. Please use the center setup page.');
    }
  }, [isAuthenticated, navigate, searchParams, electionCode, encodedCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleFingerprintVerification = (verified, file) => {
    setFingerprintVerified(verified);
    setFingerprintFile(file);
    if (!verified) {
      setError('Fingerprint verification failed. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fingerprintVerified) {
      setError('Please verify your fingerprint first.');
      return;
    }

    // Normalize and validate inputs
    const normalizedVoterId = formData.voterId?.trim();
    const normalizedExtraField = formData.extraField?.trim();
    
    if (!normalizedVoterId || !normalizedExtraField) {
      setError('Please fill in all fields.');
      return;
    }

    if (!fingerprintFile) {
      setError('Please upload your fingerprint.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(normalizedVoterId, normalizedExtraField, fingerprintFile);
      
      // Store token and user data
      login(response.token, {
        voterId: normalizedVoterId,
        role: response.voter.role
      }, fingerprintFile);

      // Redirect based on role
      if (response.voter.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        // Always redirect to encoded ballot URL if encodedCode is present in URL
        // Use encodedCode from the component scope (extracted from useParams at top level)
        if (encodedCode) {
          console.log('Redirecting to:', `/${encodedCode}/ballot`, 'from encodedCode:', encodedCode);
          navigate(`/${encodedCode}/ballot`, { replace: true });
        } else {
          console.log('No encoded code in URL, redirecting to /ballot');
          navigate('/ballot', { replace: true });
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-3xl font-bold text-gray-900 dark:text-white"
          >
            VoteGuard
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            Secure Voting with Biometric Authentication
          </motion.p>
          {electionCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-3 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg inline-block"
            >
              <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                Election Code: <span className="font-mono font-bold">{electionCode}</span>
              </p>
            </motion.div>
          )}
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-8"
        >
          {/* Voter Authentication */}
          <form onSubmit={handleSubmit} className="space-y-6">

              {/* Voter ID */}
              <div>
                <label htmlFor="voterId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voter ID
                </label>
                <input
                  id="voterId"
                  name="voterId"
                  type="text"
                  required
                  value={formData.voterId}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your voter ID"
                  disabled={isLoading}
                />
              </div>

              {/* Extra Field (DOB, Department, etc.) */}
              <div>
                <label htmlFor="extraField" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth / Department Code
                </label>
                <input
                  id="extraField"
                  name="extraField"
                  type="text"
                  required
                  value={formData.extraField}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your DOB (YYYY-MM-DD) or department code"
                  disabled={isLoading}
                />
              </div>

              {/* Fingerprint Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fingerprint Verification
                </label>
                <FingerprintUploader
                  onVerificationComplete={handleFingerprintVerification}
                  disabled={isLoading}
                />
              </div>

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={!fingerprintVerified || !formData.voterId || !formData.extraField}
                className="w-full"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our secure voting protocols
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Contact your voting center administrator
            </p>
          </div>
        </motion.div>

        {/* Demo Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Demo: Use VOTER001 with DOB 1995-05-15 for testing
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
