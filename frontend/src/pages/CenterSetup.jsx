import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { Shield, AlertCircle, CheckCircle, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { encodeElectionCode, isValidElectionCode } from '../utils/electionCode';

const CenterSetup = () => {
  const [formData, setFormData] = useState({
    electionCode: '',
    otp: '',
    centerLocation: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Convert to uppercase and remove non-alphanumeric for election code
    if (name === 'electionCode') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedCode = formData.electionCode.trim().toUpperCase();
    const trimmedOtp = formData.otp.trim();
    const trimmedLocation = formData.centerLocation.trim();

    if (!trimmedCode || !trimmedOtp || !trimmedLocation) {
      setError('Please fill in all fields');
      return;
    }

    // Validate election code format
    if (!isValidElectionCode(trimmedCode)) {
      setError('Election code must be exactly 6 alphanumeric characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/elections/setup-center', {
        electionCode: trimmedCode,
        otp: trimmedOtp,
        centerLocation: trimmedLocation
      });

      if (response.data.success) {
        const electionCode = response.data.electionCode;
        // Encode the election code for URL
        const encodedCode = encodeElectionCode(electionCode);
        setSuccess(`Center "${trimmedLocation}" has been set up successfully! Redirecting to voter login...`);
        setTimeout(() => {
          // Redirect to election-specific login page with encoded code
          navigate(`/${encodedCode}/login`);
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to set up center');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to set up center. Please check your OTP and try again.');
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
            <Building2 className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-3xl font-bold text-gray-900 dark:text-white"
          >
            Setup Voting Center
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            Enter the election OTP provided by the admin to activate this voting center
          </motion.p>
        </div>

        {/* Setup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Election Code */}
            <div>
              <label htmlFor="electionCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Election Code *
              </label>
              <input
                id="electionCode"
                name="electionCode"
                type="text"
                required
                maxLength={6}
                value={formData.electionCode}
                onChange={handleInputChange}
                className="input-field text-center text-xl font-mono tracking-wider uppercase"
                placeholder="ABCD12"
                disabled={isLoading}
                pattern="[A-Z0-9]{6}"
                title="Enter 6 alphanumeric characters"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Enter the 6-character alphanumeric election code (e.g., ABC123)
              </p>
            </div>

            {/* OTP */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Election OTP *
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                value={formData.otp}
                onChange={handleInputChange}
                className="input-field text-center text-2xl font-mono tracking-wider"
                placeholder="000000"
                disabled={isLoading}
                autoComplete="off"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Enter the 6-digit OTP provided by the admin (valid for 2 minutes)
              </p>
            </div>

            {/* Center Location */}
            <div>
              <label htmlFor="centerLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Center Location Name *
              </label>
              <input
                id="centerLocation"
                name="centerLocation"
                type="text"
                required
                value={formData.centerLocation}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., Main Hall, Room 101"
                disabled={isLoading}
              />
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
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
              disabled={!formData.electionCode || formData.electionCode.length !== 6 || !formData.otp || !formData.centerLocation.trim()}
              className="w-full"
            >
              {isLoading ? 'Setting Up...' : 'Setup Center'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/center-setup')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Setup Another Center
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CenterSetup;

