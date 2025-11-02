import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { voteService } from '../services/vote';
import { electionService } from '../services/election';
import { voterService } from '../services/voter';
import { api } from '../services/api';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { CheckCircle, User, Building2, AlertCircle, Shield, Clock, Camera, Vote, Heart, Sparkles } from 'lucide-react';
import { decodeElectionCode } from '../utils/electionCode';

const Ballot = () => {
  const [eligibleElections, setEligibleElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(5);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState('');
  const [voterInfo, setVoterInfo] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(120); // 2 minutes in seconds
  
  const { user, isAuthenticated, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const { electionCode: encodedCode } = useParams(); // Get encoded election code from URL
  
  // Refs for cleanup
  const countdownIntervalRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  
  // Decode the election code from URL (for display purposes, but use encoded in navigation)
  const electionCode = encodedCode ? decodeElectionCode(encodedCode) : null;

  useEffect(() => {
    // Don't redirect if we're in the process of logging out after voting
    if (isLoggingOut) {
      return;
    }
    
    if (!isAuthenticated()) {
      // Redirect to election-specific login if electionCode is in URL
      if (electionCode && encodedCode) {
        navigate(`/${encodedCode}/login`);
      } else {
        navigate('/login');
      }
      return;
    }

    // If we have an election code in URL, fetch election and candidates directly
    if (electionCode && encodedCode) {
      fetchElectionAndCandidates();
    } else if (!encodedCode) {
      // Fallback: fetch eligible elections (for legacy routes without election code)
      fetchEligibleElections();
    } else {
      // Invalid encoded code - redirect to login
      setError('Invalid election code. Please use the center setup page.');
      setTimeout(() => {
        navigate('/center-setup');
      }, 2000);
    }
    
    fetchVoterInfo();
    
    // Session timeout countdown
    const interval = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Force logout when session expires - always redirect to encoded login
          localStorage.removeItem('token');
          if (encodedCode) {
            navigate(`/${encodedCode}/login?message=session_expired`);
          } else {
            navigate('/login?message=session_expired');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, electionCode, encodedCode, user?.voterId, isLoggingOut]);

  // Fetch election by code and its candidates directly
  const fetchElectionAndCandidates = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch election by code
      const election = await electionService.getElectionByCode(electionCode);
      setSelectedElection({
        id: election.id,
        name: election.name,
        startDate: election.startDate,
        endDate: election.endDate,
        status: election.status
      });
      
      // Fetch candidates for this election
      const candidatesData = await api.get(`/candidates/election-code/${electionCode}`);
      
      // Fetch photos and logos for each candidate
      const candidatesWithImages = await Promise.all(
        candidatesData.data.map(async (candidate) => {
          try {
            const [photoResponse, logoResponse] = await Promise.all([
              fetch(`http://localhost:8080/api/candidates/${candidate.id}/photo`).then(r => r.json()).catch(() => ({success: false})),
              fetch(`http://localhost:8080/api/candidates/${candidate.id}/party-logo`).then(r => r.json()).catch(() => ({success: false}))
            ]);
            
            return {
              ...candidate,
              photoData: photoResponse.success ? photoResponse.photoData : null,
              logoData: logoResponse.success ? logoResponse.logoData : null
            };
          } catch (err) {
            console.warn(`Failed to fetch images for candidate ${candidate.id}:`, err);
            return candidate;
          }
        })
      );
      
      setCandidates(candidatesWithImages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching election and candidates:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load election or candidates');
      setIsLoading(false);
    }
  };

  const fetchEligibleElections = async () => {
    try {
      setIsLoading(true);
      if (!user?.voterId) {
        setError('User information not available');
        setIsLoading(false);
        return;
      }
      
      const elections = await electionService.getVoterEligibleElections(user.voterId);
      
      // Filter out elections where voter has already voted
      const availableElections = elections.filter(e => !e.hasVoted);
      
      if (availableElections.length === 0) {
        setError('No eligible elections available or you have already voted in all elections.');
        setIsLoading(false);
        return;
      }
      
      setEligibleElections(availableElections);
      
      // Auto-select first election if available
      if (availableElections.length === 1) {
        handleElectionSelect(availableElections[0]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching eligible elections:', error);
      setError(error.message || 'Failed to fetch eligible elections');
      setIsLoading(false);
    }
  };

  const handleElectionSelect = async (election) => {
    try {
      setIsLoading(true);
      setSelectedElection(election);
      setError('');
      
      // Fetch candidates for selected election
      const candidatesData = await voteService.getCandidates(election.id);
      
      // Fetch photos and logos for each candidate
      const candidatesWithImages = await Promise.all(
        candidatesData.map(async (candidate) => {
          try {
            const [photoResponse, logoResponse] = await Promise.all([
              fetch(`http://localhost:8080/api/candidates/${candidate.id}/photo`).then(r => r.json()).catch(() => ({success: false})),
              fetch(`http://localhost:8080/api/candidates/${candidate.id}/party-logo`).then(r => r.json()).catch(() => ({success: false}))
            ]);
            
            return {
              ...candidate,
              photoData: photoResponse.success ? photoResponse.photoData : null,
              logoData: logoResponse.success ? logoResponse.logoData : null
            };
          } catch (err) {
            console.warn(`Failed to fetch images for candidate ${candidate.id}:`, err);
            return candidate;
          }
        })
      );
      
      setCandidates(candidatesWithImages);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setError(error.message || 'Failed to fetch candidates');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-logout effect when thank you modal is shown
  useEffect(() => {
    if (!showThankYouModal) {
      // Clean up if modal closes
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
      }
      return;
    }

    setLogoutCountdown(5);
    
    // Countdown timer
    countdownIntervalRef.current = setInterval(() => {
      setLogoutCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Auto-logout after 5 seconds
    logoutTimeoutRef.current = setTimeout(() => {
      console.log('Auto-logout triggered after 5 seconds');
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      // Set logging out flag to prevent redirect loops
      setIsLoggingOut(true);
      // Clear auth state
      authLogout();
      setShowThankYouModal(false);
      // Navigate immediately (replace prevents back button issues)
      if (encodedCode) {
        navigate(`/${encodedCode}/login?message=vote_success`, { replace: true });
      } else {
        navigate('/login?message=vote_success', { replace: true });
      }
    }, 5000);

    // Cleanup on unmount or when modal closes
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
      }
    };
  }, [showThankYouModal, navigate, encodedCode]);

  const fetchVoterInfo = async () => {
    if (!user?.voterId) return;
    
    try {
      // Fetch voter information and profile photo
      const [voterData, photoData] = await Promise.all([
        voterService.getVoterInfo(user.voterId),
        voterService.getVoterProfilePhoto(user.voterId).catch(() => null) // Don't fail if no photo
      ]);
      
      setVoterInfo(voterData);
      
      // Check if voter has already voted
      if (voterData.hasVoted) {
      localStorage.removeItem('token');
      if (encodedCode) {
        navigate(`/${encodedCode}/login?message=already_voted`);
      } else {
        navigate('/login?message=already_voted');
      }
        return;
      }
      
      if (photoData?.success && photoData.photoData) {
        setProfilePhoto(`data:image/jpeg;base64,${photoData.photoData}`);
      }
    } catch (error) {
      console.warn('Failed to fetch voter info:', error.message);
    }
  };

  const handleVote = (candidate) => {
    if (!selectedElection) {
      setError('Please select an election first');
      return;
    }
    setSelectedCandidate(candidate);
    setShowConfirmModal(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate || !selectedElection) return;

    setIsVoting(true);
    try {
      console.log('Casting vote:', {
        candidateId: selectedCandidate.id,
        voterId: user.voterId,
        electionId: selectedElection.id
      });
      await voteService.castVote(selectedCandidate.id, user.voterId, selectedElection.id);
      setShowConfirmModal(false);
      setShowThankYouModal(true);
    } catch (error) {
      console.error('Error casting vote:', error);
      // Show more detailed error message
      const errorMsg = error.message || 'Failed to cast vote. Please ensure the voting center is properly set up.';
      setError(errorMsg);
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
          <Button onClick={fetchEligibleElections} variant="primary">
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

        {/* Election Selection */}
        {eligibleElections.length > 0 && !selectedElection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                  <Vote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Select Election
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose an election you are eligible to vote in
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eligibleElections.map((election) => (
                  <motion.div
                    key={election.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800"
                    onClick={() => handleElectionSelect(election)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                          {election.name}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            election.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {election.status}
                          </span>
                        </div>
                        {election.startDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Vote className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Candidates Section - Only show if election is selected */}
        {selectedElection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Select Your Candidate
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedElection.name}
                    </p>
                  </div>
                </div>
                {eligibleElections.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedElection(null);
                      setCandidates([]);
                    }}
                  >
                    Change Election
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading candidates...</p>
                </div>
              ) : (
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
                    {candidate.photoData ? (
                      <img
                        src={`data:image/jpeg;base64,${candidate.photoData}`}
                        alt={candidate.name}
                        className="h-24 w-24 rounded-full object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300 border-4 border-white dark:border-gray-600"
                      />
                    ) : (
                      <div className="h-24 w-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>

                  {/* Candidate Info */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {candidate.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 mb-3">
                      {candidate.logoData ? (
                        <img
                          src={`data:image/png;base64,${candidate.logoData}`}
                          alt={`${candidate.party} logo`}
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
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
              )}
            </div>
          </motion.div>
        )}

        {/* No Candidates Message */}
        {selectedElection && candidates.length === 0 && !isLoading && (
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
                {selectedCandidate.photoData ? (
                  <img
                    src={`data:image/jpeg;base64,${selectedCandidate.photoData}`}
                    alt={selectedCandidate.name}
                    className="h-16 w-16 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-600"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedCandidate.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    {selectedCandidate.logoData ? (
                      <img
                        src={`data:image/png;base64,${selectedCandidate.logoData}`}
                        alt={`${selectedCandidate.party} logo`}
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
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
                    Voter ID: {user?.voterId} • Election: {selectedElection?.name}
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

      {/* Thank You Modal */}
      <Modal
        isOpen={showThankYouModal}
        onClose={() => {}} // Prevent closing by clicking outside
        title=""
        size="lg"
      >
        <div className="space-y-6 text-center">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="h-8 w-8 text-yellow-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Thank You Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Thank You for Voting!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Your vote has been successfully recorded and secured.
            </p>
          </motion.div>

          {/* Voting Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
          >
            <div className="flex items-center justify-center mb-3">
              <Heart className="h-6 w-6 text-red-500 mr-2" />
              <p className="text-lg italic text-gray-800 dark:text-gray-200 font-medium">
                "Voting is not just a right, it's a responsibility that shapes our future together."
              </p>
            </div>
          </motion.div>

          {/* Auto-logout countdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
          >
            <Clock className="h-4 w-4" />
            <span>You will be automatically logged out in <span className="font-bold text-blue-600 dark:text-blue-400">{logoutCountdown}</span> second{logoutCountdown !== 1 ? 's' : ''}...</span>
          </motion.div>
        </div>
      </Modal>
    </div>
  );
};

export default Ballot;

