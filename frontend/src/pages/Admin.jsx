import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { stationService } from '../services/stations';
import { authService } from '../services/auth';
import Button from '../components/Button';
import FingerprintUploader from '../components/FingerprintUploader';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Users, 
  Fingerprint, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const Admin = () => {
  const { user, logout } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('stations');
  const [fingerprintFile, setFingerprintFile] = useState(null);
  const [selectedVoterId, setSelectedVoterId] = useState('');

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await stationService.getAllStations();
      setStations(data);
    } catch (error) {
      setError('Failed to load stations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLockStation = async (stationCode) => {
    try {
      await stationService.lockStation(stationCode);
      setSuccess(`Station ${stationCode} locked successfully`);
      loadStations();
    } catch (error) {
      setError('Failed to lock station: ' + error.message);
    }
  };

  const handleUnlockStation = async (stationCode) => {
    try {
      await stationService.unlockStation(stationCode);
      setSuccess(`Station ${stationCode} unlocked successfully`);
      loadStations();
    } catch (error) {
      setError('Failed to unlock station: ' + error.message);
    }
  };

  const handleFingerprintRegistration = async () => {
    if (!selectedVoterId || !fingerprintFile) {
      setError('Please select a voter and upload fingerprint');
      return;
    }

    try {
      await authService.registerFingerprint(selectedVoterId, fingerprintFile);
      setSuccess('Fingerprint registered successfully');
      setSelectedVoterId('');
      setFingerprintFile(null);
    } catch (error) {
      setError('Failed to register fingerprint: ' + error.message);
    }
  };

  const handleFingerprintUpload = (verified, file) => {
    setFingerprintFile(file);
    if (!verified) {
      setError('Fingerprint verification failed. Please try again.');
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  VoteGuard Admin Panel
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {user?.voterId}
                </p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('stations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Voting Stations
            </button>
            <button
              onClick={() => setActiveTab('fingerprints')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fingerprints'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Fingerprint className="h-4 w-4 inline mr-2" />
              Fingerprint Registration
            </button>
          </nav>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </motion.div>
        )}

        {/* Content */}
        <div className="mt-8">
          {activeTab === 'stations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Voting Stations Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lock or unlock voting stations to control voting access
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stations.map((station) => (
                      <div
                        key={station.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {station.stationCode}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              station.isLocked
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}
                          >
                            {station.isLocked ? (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Locked
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3 w-3 mr-1" />
                                Unlocked
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {station.location}
                        </p>
                        <div className="flex space-x-2">
                          {station.isLocked ? (
                            <Button
                              onClick={() => handleUnlockStation(station.stationCode)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unlock
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleLockStation(station.stationCode)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Lock
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'fingerprints' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Fingerprint Registration
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Register fingerprints for voters
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Voter ID
                      </label>
                      <input
                        type="text"
                        value={selectedVoterId}
                        onChange={(e) => setSelectedVoterId(e.target.value)}
                        className="input-field"
                        placeholder="Enter voter ID (e.g., VOTER001)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fingerprint Upload
                      </label>
                      <FingerprintUploader
                        onVerificationComplete={handleFingerprintUpload}
                        disabled={false}
                      />
                    </div>

                    <Button
                      onClick={handleFingerprintRegistration}
                      disabled={!selectedVoterId || !fingerprintFile}
                      className="w-full"
                    >
                      <Fingerprint className="h-4 w-4 mr-2" />
                      Register Fingerprint
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;




