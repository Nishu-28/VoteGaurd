import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Shield, AlertCircle, CheckCircle, User, Calendar } from 'lucide-react';
import FingerprintUploader from '../components/FingerprintUploader';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import Button from '../components/Button';

const VoterRegistration = () => {
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
  const [elections, setElections] = useState([]);
  const [eligibleElections, setEligibleElections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/elections/active');
      if (response.ok) {
        const data = await response.json();
        setElections(data);
        // Default: no elections selected (user must choose)
        setEligibleElections([]);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const handleSelectAllElections = () => {
    if (eligibleElections.length === elections.length) {
      // Deselect all
      setEligibleElections([]);
    } else {
      // Select all
      setEligibleElections(elections.map(election => election.id));
    }
  };

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

    if (eligibleElections.length === 0) {
      setError('Please select at least one election for this voter.');
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
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('voterId', formData.voterId);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('extraField', formData.extraField);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('fingerprint', fingerprintFile);
      formDataToSend.append('profilePhoto', profilePhotoFile);

      // Make API call to backend
      const response = await fetch('http://localhost:8080/voters/register', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setError('');
        
        // Reset form
        setFormData({
          voterId: '',
          fullName: '',
          email: '',
          extraField: '',
          role: 'VOTER'
        });
        setFingerprintFile(null);
        setProfilePhotoFile(null);
        setFingerprintVerified(false);
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please check if the backend service is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      voterId: '',
      fullName: '',
      email: '',
      extraField: '',
      role: 'VOTER'
    });
    setFingerprintFile(null);
    setProfilePhotoFile(null);
    setFingerprintVerified(false);
    setError('');
    setSuccess(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voter Registration</h1>
            <p className="text-gray-600">Register new voters with biometric authentication</p>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voter ID */}
              <div>
                <label htmlFor="voterId" className="block text-sm font-medium text-gray-700 mb-2">
                  Voter ID *
                </label>
                <input
                  id="voterId"
                  name="voterId"
                  type="text"
                  required
                  value={formData.voterId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter voter ID"
                  disabled={isLoading}
                />
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email"
                  disabled={isLoading}
                />
              </div>

              {/* Extra Field */}
              <div>
                <label htmlFor="extraField" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth / Department Code *
                </label>
                <input
                  id="extraField"
                  name="extraField"
                  type="text"
                  required
                  value={formData.extraField}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="YYYY-MM-DD or Department Code"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Eligible Elections */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Eligible Elections
            </h3>
            
            {elections.length > 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Select which elections this voter will be eligible to participate in: *
                  </p>
                  <button
                    type="button"
                    onClick={handleSelectAllElections}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {eligibleElections.length === elections.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-3">
                  {elections.map(election => (
                    <div key={election.id} className="flex items-center justify-between bg-white p-4 rounded border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`election-${election.id}`}
                          checked={eligibleElections.includes(election.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEligibleElections(prev => [...prev, election.id]);
                            } else {
                              setEligibleElections(prev => prev.filter(id => id !== election.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <label htmlFor={`election-${election.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                            {election.name}
                          </label>
                          <p className="text-xs text-gray-500">{election.description}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          election.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800'
                            : election.status === 'UPCOMING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {election.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`mt-4 p-3 rounded border ${
                  eligibleElections.length === 0 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm ${
                    eligibleElections.length === 0 
                      ? 'text-red-800' 
                      : 'text-blue-800'
                  }`}>
                    <strong>Selected:</strong> {eligibleElections.length} election(s)
                    {eligibleElections.length === 0 && ' (Required: Select at least one)'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  No active elections available. The voter will be notified when elections become available.
                </p>
              </div>
            )}
          </div>

          {/* Biometric Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Biometric Information
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Fingerprint Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fingerprint Enrollment *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload fingerprint image. It will be automatically validated and enrolled.
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload a clear profile photo for identification.
                </p>
                <ProfilePhotoUploader
                  onPhotoSelected={handleProfilePhotoSelected}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-600 font-medium">
                Voter registered successfully! You can register another voter or view the voter list.
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={!fingerprintVerified || !profilePhotoFile || !formData.voterId || !formData.fullName || !formData.email || !formData.extraField}
              className="flex-1"
            >
              {isLoading ? 'Registering Voter...' : 'Register Voter'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={resetForm}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Reset Form
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoterRegistration;