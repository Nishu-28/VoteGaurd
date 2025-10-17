import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { voteService } from '../services/vote';
import { stationService } from '../services/stations';
import { voterService } from '../services/voter';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { CheckCircle, User, Building2, AlertCircle, MapPin, Shield, Clock, Camera } from 'lucide-react';

const Ballot = () => {
  const [candidates, setCandidates] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedStation, setSelectedStation] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState('');
  const [voterInfo, setVoterInfo] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(120); // 2 minutes in seconds
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    fetchData();
    fetchVoterInfo();
    
    // Session timeout countdown
    const interval = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Force logout when session expires
          localStorage.removeItem('token');
          navigate('/login?message=session_expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [candidatesData, stationsData] = await Promise.all([
        voteService.getCandidates(),
        stationService.getUnlockedStations()
      ]);
      setCandidates(candidatesData);
      setStations(stationsData);
      
      // Auto-select first station if available
      if (stationsData.length > 0) {
        setSelectedStation(stationsData[0].stationCode);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoterInfo = async () => {
    if (!user?.voterId) return;
    
    try {
      // Fetch voter information and profile photo
      const [voterData, photoData] = await Promise.all([
        voterService.getVoterInfo(user.voterId),
        voterService.getVoterProfilePhoto(user.voterId).catch(() => null) // Don't fail if no photo
      ]);
      
      setVoterInfo(voterData);
      if (photoData?.success && photoData.photoData) {
        setProfilePhoto(`data:image/jpeg;base64,${photoData.photoData}`);
      }
    } catch (error) {
      console.warn('Failed to fetch voter info:', error.message);
    }
  };

  const handleVote = (candidate) => {
    if (!selectedStation) {
      setError('Please select a voting station first');
      return;
    }
    setSelectedCandidate(candidate);
    setShowConfirmModal(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate || !selectedStation) return;

    setIsVoting(true);
    try {
      await voteService.castVote(selectedCandidate.id, user.voterId, selectedStation);
      setShowConfirmModal(false);
      // Force logout after voting
      localStorage.removeItem('token');
      navigate('/login?message=vote_success');
    } catch (error) {
      setError(error.message);
      setShowConfirmModal(false);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCancelVote = () => {
    setSelectedCandidate(null);
    setShowConfirmModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading candidates...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Ballot
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchData} variant="primary">
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Navigation Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">VoteGuard</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Secure Voting System</p>
                </div>
              </div>
            </div>

            {/* Voter Info */}
            <div className="flex items-center space-x-6">
              {/* Session Timer */}
              <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Session: {formatTime(sessionTimeLeft)}
                </span>
              </div>

              {/* Voter Profile */}
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <div className="relative">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Voter Photo"
                      className="h-10 w-10 rounded-full object-cover border-2 border-blue-200 dark:border-blue-700"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-blue-200 dark:border-blue-700">
                      <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {voterInfo?.fullName || 'Voter'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {user?.voterId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Center-Based Voting Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Electronic Voting Station
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Welcome to the secure voting center. Please select your preferred candidate.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Biometric Verified</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span>Secure Session</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <span>Encrypted Vote</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Station Selection */}
        {stations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Voting Station Selection
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose your designated voting station
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stations.map((station) => (
                  <motion.div
                    key={station.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                      selectedStation === station.stationCode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedStation(station.stationCode)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {station.stationCode}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {station.location}
                        </p>
                        <div className="flex items-center mt-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Active
                          </span>
                        </div>
                      </div>
                      {selectedStation === station.stationCode && (
                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Candidates Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Your Candidate
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose your preferred candidate from the list below
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleVote(candidate)}
                >
                  {/* Candidate Avatar */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="h-24 w-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {candidate.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 mb-3">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">{candidate.party}</span>
                    </div>
                    {candidate.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {candidate.description}
                      </p>
                    )}
                  </div>

                  {/* Vote Button */}
                  <Button
                    variant="primary"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(candidate);
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Vote for {candidate.name}</span>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* No Candidates Message */}
        {candidates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Candidates Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are currently no candidates to vote for.
            </p>
          </motion.div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelVote}
        title=""
        size="lg"
      >
        {selectedCandidate && (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Confirm Your Vote
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please review your selection before confirming
              </p>
            </div>

            {/* Selected Candidate */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedCandidate.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{selectedCandidate.party}</span>
                  </div>
                  {selectedCandidate.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {selectedCandidate.description}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Voter Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Voter Photo"
                      className="h-12 w-12 rounded-full object-cover border-2 border-blue-200 dark:border-blue-700"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-blue-200 dark:border-blue-700">
                      <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-700"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {voterInfo?.fullName || 'Voter'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Voter ID: {user?.voterId} • Station: {selectedStation}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Important Security Notice
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Your vote is encrypted and cannot be changed once submitted</li>
                    <li>• Your identity is verified through biometric authentication</li>
                    <li>• This action will be logged for audit purposes</li>
                    <li>• You will be logged out automatically after voting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                variant="secondary"
                onClick={handleCancelVote}
                className="flex-1 py-3 text-lg font-semibold"
                disabled={isVoting}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleConfirmVote}
                className="flex-1 py-3 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                loading={isVoting}
              >
                {isVoting ? 'Casting Vote...' : 'Confirm & Submit Vote'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Ballot;

