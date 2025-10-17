import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Shield, AlertCircle, CheckCircle, ArrowLeft, User } from 'lucide-react';
import { registrationService } from '../services/registration';
import FingerprintUploader from '../components/FingerprintUploader';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import Button from '../components/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    voterId: '',
    fullName: '',
    email: '',
    extraField: '',
    role: 'VOTER'
  });
  
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

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
    console.log('🔍 Fingerprint verification result:', { verified, fileName: file?.name });
    setFingerprintVerified(verified);
    setFingerprintFile(file);
    if (!verified) {
      setError('Fingerprint verification failed. Please try again.');
    }
  };

  const handleProfilePhotoSelected = (file) => {
    setProfilePhotoFile(file);
    if (!file) {
      setError('Profile photo is required.');
    }
  };

  const validateForm = () => {
    if (!formData.voterId.trim()) {
      setError('Voter ID is required.');
      return false;
    }
    
    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required.');
      return false;
    }
    
    if (!formData.extraField.trim()) {
      setError('Date of Birth or Department Code is required.');
      return false;
    }
    
    if (!fingerprintFile) {
      setError('Fingerprint is required.');
      return false;
    }
    
    if (!fingerprintVerified) {
      setError('Fingerprint verification is required.');
      return false;
    }
    
    if (!profilePhotoFile) {
      setError('Profile photo is required.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        voterId: formData.voterId,
        fullName: formData.fullName,
        email: formData.email,
        extraField: formData.extraField,
        role: formData.role,
        fingerprint: fingerprintFile,
        profilePhoto: profilePhotoFile
      };

      const result = await registrationService.registerVoter(registrationData);
      
      if (result.success) {
        setSuccess(true);
        setError('');
        
        // Redirect to login after successful registration
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please login with your credentials.' 
            } 
          });
        }, 2000);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
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
        className="max-w-2xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center"
          >
            <UserPlus className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-3xl font-bold text-gray-900 dark:text-white"
          >
            Voter Registration
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            Register for secure voting with biometric authentication
          </motion.p>
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Voter ID */}
                <div>
                  <label htmlFor="voterId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voter ID *
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

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>

                {/* Extra Field */}
                <div>
                  <label htmlFor="extraField" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth / Department Code *
                  </label>
                  <input
                    id="extraField"
                    name="extraField"
                    type="text"
                    required
                    value={formData.extraField}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="YYYY-MM-DD or Department Code"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Biometric Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Biometric Information
              </h3>
              
              {/* Fingerprint Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fingerprint Enrollment *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Upload your fingerprint image. It will be automatically validated and enrolled.
                </p>
                <FingerprintUploader
                  onVerificationComplete={handleFingerprintVerification}
                  disabled={isLoading}
                  mode="enroll"
                  voterId={formData.voterId}
                />
              </div>

              {/* Profile Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Photo *
                </label>
                <ProfilePhotoUploader
                  onPhotoSelected={handleProfilePhotoSelected}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  Registration successful! Redirecting to login...
                </p>
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
              disabled={!fingerprintVerified || !profilePhotoFile || !formData.voterId || !formData.fullName || !formData.email || !formData.extraField}
              className="w-full"
              onClick={() => {
                console.log('🔍 Button state check:', {
                  fingerprintVerified,
                  profilePhotoFile: !!profilePhotoFile,
                  voterId: formData.voterId,
                  fullName: formData.fullName,
                  email: formData.email,
                  extraField: formData.extraField,
                  disabled: !fingerprintVerified || !profilePhotoFile || !formData.voterId || !formData.fullName || !formData.email || !formData.extraField
                });
              }}
            >
              {isLoading ? 'Registering Voter...' : 'Complete Registration'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By registering, you agree to our secure voting protocols
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
