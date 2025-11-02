import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Edit, Trash2, AlertCircle, CheckCircle, Key, Clock, MapPin, Copy } from 'lucide-react';
import Button from '../components/Button';
import { electionsAPI } from '../services/api';

const Elections = () => {
  const [elections, setElections] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingElection, setEditingElection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpData, setOtpData] = useState({}); // { electionId: { otp, expiresAt, timeLeft } }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'UPCOMING'
  });

  useEffect(() => {
    fetchElections();
  }, []);

  // OTP countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setOtpData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(electionIdKey => {
          const data = updated[electionIdKey];
          if (data && data.expiresAt) {
            try {
              const now = new Date();
              let expires;
              
              // Handle expiresAt in different formats
              if (typeof data.expiresAt === 'string') {
                expires = new Date(data.expiresAt);
              } else {
                expires = new Date(data.expiresAt);
              }
              
              // Validate the date
              if (isNaN(expires.getTime())) {
                console.warn('Invalid expiresAt date for election:', electionIdKey, data.expiresAt);
                // Keep the OTP data but don't update timeLeft
                updated[electionIdKey] = { ...data };
                return updated;
              }
              
              const diffMs = expires.getTime() - now.getTime();
              const diff = Math.floor(diffMs / 1000);
              
              // Only remove if truly expired (with 1 second buffer to prevent flickering)
              if (diff <= -1) {
                // Expired, remove it
                // Debug logging (commented out for cleaner console)
                // console.log('OTP expired for election:', electionIdKey);
                delete updated[electionIdKey];
              } else if (diff < 0) {
                // Less than 1 second left but not fully expired yet - keep it with 0
                updated[electionIdKey] = { ...data, timeLeft: 0 };
              } else {
                // Update time left
                updated[electionIdKey] = { ...data, timeLeft: diff };
              }
            } catch (error) {
              console.error('Error calculating time left for election:', electionIdKey, error);
              // Keep the OTP data even if there's an error
              updated[electionIdKey] = { ...data };
            }
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchElections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/elections');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched elections:', data);
        setElections(data);
        // Don't clear otpData when fetching elections - preserve OTP state
      } else {
        setError('Failed to fetch elections');
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'UPCOMING'
    });
    setEditingElection(null);
    setShowCreateForm(false);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Election name is required');
      return false;
    }
    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }
    if (!formData.endDate) {
      setError('End date is required');
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const electionData = {
        ...formData
      };

      const url = editingElection 
        ? `http://localhost:8080/api/elections/${editingElection.id}`
        : 'http://localhost:8080/api/elections';
      
      const method = editingElection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(electionData)
      });

      if (response.ok) {
        setSuccess(editingElection ? 'Election updated successfully!' : 'Election created successfully!');
        resetForm();
        fetchElections();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save election');
      }
    } catch (error) {
      console.error('Error saving election:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (election) => {
    setEditingElection(election);
    setFormData({
      name: election.name,
      description: election.description || '',
      startDate: election.startDate,
      endDate: election.endDate,
      status: election.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (electionId) => {
    if (!confirm('Are you sure you want to delete this election?')) return;

    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8080/api/elections/${electionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Election deleted successfully!');
        fetchElections();
      } else {
        setError('Failed to delete election');
      }
    } catch (error) {
      console.error('Error deleting election:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateOTP = async (electionId) => {
    // Debug logging (commented out for cleaner console)
    // console.log('Generating OTP for election ID:', electionId);
    try {
      setIsLoading(true);
      setError('');
      
      // Use the API service with proper authentication
      const response = await fetch(`http://localhost:8080/api/elections/${electionId}/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Debug logging (commented out for cleaner console)
        // console.log('OTP Response:', data);
        
        if (data.success && data.otp && data.expiresAt) {
          // Parse the expiresAt - handle ISO format from backend
          let expiresAt;
          try {
            // Backend sends ISO_LOCAL_DATE_TIME format like "2024-01-01T12:00:00" (without timezone)
            // Parse it as local time
            const expiresStr = String(data.expiresAt);
            
            // Backend now sends ISO_INSTANT format (with Z timezone)
            // Format: "2024-01-01T12:00:00Z" or "2024-01-01T12:00:00.123Z"
            // Or ISO_LOCAL_DATE_TIME: "2024-01-01T12:00:00"
            if (expiresStr.includes('Z')) {
              // Has UTC timezone (Z), parse directly
              expiresAt = new Date(expiresStr);
            } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(expiresStr)) {
              // ISO_LOCAL_DATE_TIME format without timezone - treat as local
              expiresAt = new Date(expiresStr);
            } else {
              // Fallback: try parsing as-is
              expiresAt = new Date(expiresStr);
            }
            
            // Validate the parsed date
            if (isNaN(expiresAt.getTime())) {
              console.error('Invalid expiresAt format:', data.expiresAt);
              setError('Received invalid expiration date from server');
              return;
            }
            
            // Ensure the date is in the future (should be ~2 minutes from now)
            const now = new Date();
            const timeDiffMs = expiresAt.getTime() - now.getTime();
            
            if (timeDiffMs <= 0) {
              // If expiration is in the past (likely timezone issue), adjust it to 2 minutes from now
              console.warn('OTP expiration time is in the past. Time diff:', (timeDiffMs / 1000 / 60).toFixed(2), 'minutes. Adjusting to 2 minutes from now.');
              expiresAt = new Date(now.getTime() + 2 * 60 * 1000);
            } else if (timeDiffMs > 5 * 60 * 1000) {
              // If expiration is more than 5 minutes away, something's wrong
              console.warn('OTP expiration time seems incorrect. Expected ~2 minutes, got:', (timeDiffMs / 1000 / 60).toFixed(2), 'minutes');
            }
          } catch (parseError) {
            console.error('Error parsing expiresAt:', parseError, data.expiresAt);
            setError('Failed to parse expiration date');
            return;
          }
          
          const now = new Date();
          const timeLeftMs = expiresAt.getTime() - now.getTime();
          const timeLeft = Math.max(0, Math.floor(timeLeftMs / 1000));
          
          // Debug logging (commented out for cleaner console - uncomment if needed)
          // console.log('Setting OTP data:', { electionId, otp: data.otp, expiresAt: expiresAt.toISOString(), timeLeft });
          
          // Validate timeLeft is reasonable (should be around 120 seconds = 2 minutes)
          if (timeLeft > 150) {
            console.warn('⚠️ TimeLeft is more than 2.5 minutes:', timeLeft, 'seconds');
          }
          if (timeLeft < 0) {
            console.error('❌ TimeLeft is negative! OTP already expired. TimeLeft:', timeLeft, 'seconds');
          }
          
          // Use String(electionId) to ensure consistent key type
          const electionKey = String(electionId);
          
          const otpInfo = {
            otp: data.otp,
            expiresAt: expiresAt.toISOString(), // Store as ISO string for consistent parsing
            timeLeft: timeLeft
          };
          
          // Debug logging (commented out for cleaner console)
          // console.log('Storing OTP with key:', electionKey, 'OTP:', data.otp);
          
          setOtpData(prev => {
            const updated = {
              ...prev,
              [electionKey]: otpInfo
            };
            return updated;
          });
          
          // Verify state was set correctly after React state update (only log on error)
          setTimeout(() => {
            setOtpData(currentState => {
              const check = currentState[electionKey];
              if (!check || !check.otp) {
                console.error('❌ State verification FAILED - OTP not found in state for key:', electionKey);
                // Re-add if missing (shouldn't happen, but safety net)
                if (!check) {
                  return {
                    ...currentState,
                    [electionKey]: otpInfo
                  };
                }
              }
              return currentState;
            });
          }, 200);
          
          
          setSuccess(`OTP generated for ${elections.find(e => String(e.id) === electionKey)?.name || 'election'}. Valid for 2 minutes.`);
          setTimeout(() => setSuccess(''), 5000);
        } else {
          setError(data.message || 'Failed to generate OTP');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate OTP' }));
        setError(errorData.message || 'Failed to generate OTP');
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    }).catch(() => {
      setError('Failed to copy to clipboard');
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Elections Management</h1>
          <p className="text-gray-600">Create and manage elections</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Election</span>
        </Button>
      </div>

      {/* Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-sm text-green-600">{success}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Create/Edit Election Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white rounded-lg shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingElection ? 'Edit Election' : 'Create New Election'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Election Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Student Council Election 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description of the election..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="flex-1"
              >
                {editingElection ? 'Update Election' : 'Create Election'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={resetForm}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Elections List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Elections</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading elections...</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No elections found. Create your first election to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {elections.map((election) => (
              <div key={election.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{election.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(election.status)}`}>
                        {election.status}
                      </span>
                    </div>
                    
                    {election.description && (
                      <p className="text-gray-600 mb-3">{election.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {election.startDate ? new Date(election.startDate).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>End: {election.endDate ? new Date(election.endDate).toLocaleString() : 'N/A'}</span>
                      </div>
                      {election.activeCenterLocation && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <MapPin className="h-4 w-4" />
                          <span>Center: {election.activeCenterLocation}</span>
                        </div>
                      )}
                    </div>

                    {/* Election Code Display - Always show */}
                    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Key className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Election Code:</span>
                        <span className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                          {election.electionCode || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This is the permanent election identifier
                      </p>
                    </div>

                    {/* OTP Display */}
                    {(() => {
                      // Use consistent key type (string) to match what we store
                      const electionKey = String(election.id);
                      const currentOtp = otpData[electionKey];
                      
                      // Debug logging (only log once per render to avoid spam)
                      // Commented out for production - uncomment if debugging needed
                      // console.log('Checking OTP for election:', {
                      //   electionId: election.id,
                      //   electionKey,
                      //   electionKeyType: typeof electionKey,
                      //   otpDataKeys: Object.keys(otpData),
                      //   currentOtp,
                      //   allOtpData: otpData
                      // });
                      
                      // Only log if OTP is found (remove the warning as it's just debug noise)
                      // The warning was triggered during normal renders when OTP exists for other elections
                      // if (currentOtp && currentOtp.otp) {
                      //   console.log('✓ OTP FOUND - Displaying OTP:', currentOtp.otp, 'for election:', electionKey);
                      // }
                      
                      // Display OTP if it exists (check for otp property, not just the object)
                      return currentOtp && currentOtp.otp ? (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-3 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                                <Key className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Temporary OTP Code</p>
                                <div className="flex items-center space-x-3 mt-1">
                                  <p className="text-4xl font-mono font-bold text-blue-600 tracking-widest">
                                    {currentOtp.otp}
                                  </p>
                                  <button
                                    onClick={() => copyToClipboard(currentOtp.otp)}
                                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                    title="Copy OTP"
                                  >
                                    <Copy className="h-4 w-4 text-blue-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${
                                (currentOtp.timeLeft || 0) < 30 
                                  ? 'bg-red-50 border-red-300' 
                                  : 'bg-yellow-50 border-yellow-200'
                              }`}>
                                <Clock className={`h-4 w-4 ${
                                  (currentOtp.timeLeft || 0) < 30 ? 'text-red-600' : 'text-yellow-600'
                                }`} />
                                <span className={`text-sm font-bold ${
                                  (currentOtp.timeLeft || 0) < 30 ? 'text-red-700' : 'text-yellow-700'
                                }`}>
                                  {formatTime(Math.max(0, currentOtp.timeLeft || 0))}
                                </span>
                              </div>
                              {currentOtp.timeLeft !== undefined && currentOtp.timeLeft < 30 && (
                                <span className="text-xs text-red-600 font-medium">Expiring soon!</span>
                              )}
                            </div>
                          </div>
                          <div className="bg-blue-100 rounded-md p-3 border border-blue-200">
                            <p className="text-xs text-blue-800 font-medium mb-2">
                              📞 <strong>Instructions:</strong> Call the in-center admin and provide them with this OTP code. 
                              They will enter it in the Center Setup page to activate voting at their location.
                            </p>
                            <p className="text-xs text-blue-600">
                              ⏱️ This code expires in {formatTime(Math.max(0, currentOtp.timeLeft || 0))} - generate a new one if needed.
                            </p>
                          </div>
                        </motion.div>
                      ) : null;
                    })()}
                    
                    {/* Show message if no OTP generated yet */}
                    {!otpData[String(election.id)] && (election.status === 'ACTIVE' || election.status === 'UPCOMING') && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-700">
                          💡 Click "Generate OTP" to create a temporary code for center setup
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    {(election.status === 'ACTIVE' || election.status === 'UPCOMING') && (
                      <Button
                        onClick={() => handleGenerateOTP(election.id)}
                        variant="primary"
                        size="sm"
                        disabled={isLoading}
                        className="flex items-center justify-center space-x-2"
                      >
                        <Key className="h-4 w-4" />
                        <span>Generate OTP</span>
                      </Button>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleEdit(election)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(election.id)}
                        variant="danger"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Elections;