import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, AlertCircle, CheckCircle, Save, User, Shield, Calendar } from 'lucide-react';
import Button from '../components/Button';
import FingerprintUploader from '../components/FingerprintUploader';

const VoterEditModal = ({ voter, isOpen, onClose, onSave }) => {
  const [editData, setEditData] = useState({
    email: '',
    extraField: '',
    isActive: true,
    eligibleElections: []
  });

  const [elections, setElections] = useState([]);
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && voter) {
      setEditData({
        email: voter.email || '',
        extraField: voter.extraField || '',
        isActive: voter.isActive !== undefined ? voter.isActive : true,
        eligibleElections: voter.eligibleElections || []
      });
      fetchElections();
      setFingerprintVerified(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen, voter]);

  const fetchElections = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/elections');
      if (response.ok) {
        const data = await response.json();
        setElections(data);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleElectionToggle = (electionId) => {
    setEditData(prev => ({
      ...prev,
      eligibleElections: prev.eligibleElections.includes(electionId)
        ? prev.eligibleElections.filter(id => id !== electionId)
        : [...prev.eligibleElections, electionId]
    }));
  };

  const handleFingerprintVerification = async (verified, file) => {
    if (verified && file && voter?.voterId) {
      setIsVerifying(true);
      try {
        // Call backend API to verify fingerprint matches the voter
        const formData = new FormData();
        formData.append('fingerprint', file);
        formData.append('voterId', voter.voterId);

        const response = await fetch('http://localhost:8080/api/biometric/verify-fingerprint', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        if (response.ok && result.verified) {
          setFingerprintVerified(true);
          setFingerprintFile(file);
          setSuccess('Fingerprint verified successfully! You can now edit voter details.');
          setError('');
        } else {
          setFingerprintVerified(false);
          setError('Fingerprint verification failed. The fingerprint does not match this voter.');
          setSuccess('');
        }
      } catch (error) {
        setFingerprintVerified(false);
        setError('Fingerprint verification failed. Please try again.');
        setSuccess('');
      } finally {
        setIsVerifying(false);
      }
    } else {
      setFingerprintVerified(false);
      setError('Fingerprint verification failed. Please try again.');
      setSuccess('');
    }
  };

  const handleSave = async () => {
    if (!fingerprintVerified) {
      setError('Fingerprint verification is required to edit voter details.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const updateData = {
        id: voter.id,
        email: editData.email,
        extraField: editData.extraField,
        isActive: editData.isActive,
        eligibleElections: editData.eligibleElections
      };

      // Call the onSave prop with updated data
      await onSave(updateData);
      setSuccess('Voter details updated successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setError('Failed to update voter details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setEditData({
      email: '',
      extraField: '',
      isActive: true,
      eligibleElections: []
    });
    setFingerprintVerified(false);
    setFingerprintFile(null);
    setError('');
    setSuccess('');
    setIsSaving(false);
    onClose();
  };

  if (!voter) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={handleClose}
            />

            {/* Center modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Edit Voter Details</h3>
                      <p className="text-sm text-gray-500">{voter.fullName} (ID: {voter.voterId})</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-4">
                {/* Error/Success Messages */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-700">{success}</span>
                  </motion.div>
                )}

                {/* Security Verification */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="h-5 w-5 text-orange-500" />
                    <h4 className="text-sm font-medium text-gray-900">Security Verification Required</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Fingerprint verification is required to edit voter details. Only non-primary information can be modified.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <FingerprintUploader
                      onVerificationComplete={handleFingerprintVerification}
                      disabled={isVerifying || fingerprintVerified}
                      mode="verify"
                      voterId={voter.voterId}
                    />
                  </div>
                </div>

                {/* Edit Form */}
                {fingerprintVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Editable Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth / Department Code
                        </label>
                        <input
                          type="text"
                          name="extraField"
                          value={editData.extraField}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="YYYY-MM-DD or Department Code"
                        />
                      </div>
                    </div>

                    {/* Account Status */}
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={editData.isActive}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Active Account</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Uncheck to deactivate this voter account
                      </p>
                    </div>

                    {/* Eligible Elections */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 flex items-center mb-3">
                        <Calendar className="h-4 w-4 mr-2" />
                        Eligible Elections
                      </h4>
                      
                      {elections.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {elections.map(election => (
                            <div key={election.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id={`edit-election-${election.id}`}
                                  checked={editData.eligibleElections.includes(election.id)}
                                  onChange={() => handleElectionToggle(election.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div>
                                  <label htmlFor={`edit-election-${election.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                                    {election.name}
                                  </label>
                                  <p className="text-xs text-gray-500">{election.description}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                election.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-800'
                                  : election.status === 'UPCOMING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {election.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No elections available</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  disabled={isSaving}
                  className="mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
                {fingerprintVerified && (
                  <Button
                    onClick={handleSave}
                    loading={isSaving}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoterEditModal;