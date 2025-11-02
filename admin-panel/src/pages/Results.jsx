import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Vote, 
  RefreshCw, 
  Trophy,
  PieChart,
  Calendar,
  Award,
  AlertCircle
} from 'lucide-react';
import { electionsAPI, resultsAPI, candidatesAPI } from '../services/api';

const Results = () => {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState(null);
  const [electionDetails, setElectionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [candidatePhotos, setCandidatePhotos] = useState({});

  useEffect(() => {
    fetchElections();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchElectionResults(selectedElection.id);
      fetchElectionDetails(selectedElection.id);
    }
  }, [selectedElection]);

  useEffect(() => {
    if (autoRefresh && selectedElection) {
      const interval = setInterval(() => {
        fetchElectionResults(selectedElection.id);
      }, 10000); // Refresh every 10 seconds
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, selectedElection]);

  const fetchElections = async () => {
    try {
      setIsLoading(true);
      const response = await electionsAPI.getAll();
      const electionsList = response.data || [];
      setElections(electionsList);
      
      // Auto-select first active/completed election if available
      if (electionsList.length > 0 && !selectedElection) {
        const activeOrCompleted = electionsList.find(
          e => e.status === 'ACTIVE' || e.status === 'COMPLETED'
        ) || electionsList[0];
        setSelectedElection(activeOrCompleted);
      }
      
      setError('');
    } catch (error) {
      console.error('Error fetching elections:', error);
      setError('Failed to load elections');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchElectionDetails = async (electionId) => {
    try {
      const response = await electionsAPI.getById(electionId);
      setElectionDetails(response.data);
    } catch (error) {
      console.error('Error fetching election details:', error);
    }
  };

  const fetchElectionResults = async (electionId) => {
    try {
      setIsLoadingResults(true);
      const response = await resultsAPI.getElectionResults(electionId);
      setResults(response.data);
      
      // Fetch candidate photos
      if (response.data && response.data.candidateResults) {
        const photoPromises = response.data.candidateResults.map(async (candidate) => {
          if (candidate.hasPhoto) {
            try {
              const photoResponse = await candidatesAPI.getPhoto(candidate.candidateId);
              if (photoResponse.data && photoResponse.data.success && photoResponse.data.photoData) {
                return {
                  candidateId: candidate.candidateId,
                  photoData: photoResponse.data.photoData
                };
              }
            } catch (error) {
              // Silently handle missing photos - not all candidates may have photos
              console.debug(`No photo available for candidate ${candidate.candidateId}`);
            }
          }
          return null;
        });
        
        const photos = await Promise.all(photoPromises);
        const photoMap = {};
        photos.forEach(photo => {
          if (photo) {
            photoMap[photo.candidateId] = `data:image/jpeg;base64,${photo.photoData}`;
          }
        });
        setCandidatePhotos(photoMap);
      } else {
        // Clear photos when results change
        setCandidatePhotos({});
      }
      
      setError('');
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load election results');
      setResults(null);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleElectionChange = (election) => {
    setSelectedElection(election);
    setResults(null);
    setCandidatePhotos({}); // Clear photos when election changes
  };

  const getMaxVotes = () => {
    if (!results || !results.candidateResults || results.candidateResults.length === 0) {
      return 1;
    }
    return Math.max(...results.candidateResults.map(c => c.voteCount || 0), 1);
  };

  const getWinner = () => {
    if (!results || !results.candidateResults || results.candidateResults.length === 0) {
      return null;
    }
    return results.candidateResults[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'UPCOMING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const winner = getWinner();
  const maxVotes = getMaxVotes();
  const totalVotes = results?.totalVotes || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Election Results
            </h1>
            <p className="mt-2 text-gray-600">View real-time voting results by election</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Auto-refresh (10s)</span>
            </label>
            <button
              onClick={() => selectedElection && fetchElectionResults(selectedElection.id)}
              disabled={isLoadingResults || !selectedElection}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingResults ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
        >
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Election Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Election
        </label>
        <select
          value={selectedElection?.id || ''}
          onChange={(e) => {
            const election = elections.find(el => el.id === parseInt(e.target.value));
            handleElectionChange(election);
          }}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value="">-- Select an Election --</option>
          {elections.map((election) => (
            <option key={election.id} value={election.id}>
              {election.name} ({election.status})
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoadingResults && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      )}

      {/* Results Display */}
      {!isLoadingResults && results && electionDetails && (
        <div className="space-y-6">
          {/* Election Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{electionDetails.name}</h2>
                <p className="mt-1 text-gray-600">{electionDetails.description}</p>
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(electionDetails.startDate).toLocaleDateString()} - {new Date(electionDetails.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(electionDetails.status)}`}>
                    {electionDetails.status}
                  </span>
                  {electionDetails.electionCode && (
                    <span className="text-sm text-gray-600 font-mono">
                      Code: {electionDetails.electionCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Votes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{results.totalVotes}</p>
                </div>
                <Vote className="h-10 w-10 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Voters Voted</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{results.votersWhoVoted}</p>
                </div>
                <Users className="h-10 w-10 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Turnout</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {results.votingPercentage.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Candidates</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {results.candidateResults?.length || 0}
                  </p>
                </div>
                <Award className="h-10 w-10 text-orange-600" />
              </div>
            </motion.div>
          </div>

          {/* Winner Card */}
          {winner && winner.voteCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow-lg p-6 border-2 border-yellow-300"
            >
              <div className="flex items-center gap-4">
                {candidatePhotos[winner.candidateId] ? (
                  <div className="relative">
                    <img
                      src={candidatePhotos[winner.candidateId]}
                      alt={winner.candidateName}
                      className="h-20 w-20 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1.5">
                      <Trophy className="h-5 w-5 text-yellow-900" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-400 rounded-full p-4 h-20 w-20 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-yellow-900" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900">Leading Candidate</h3>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {winner.candidateName}
                    {winner.party && ` (${winner.party})`}
                  </p>
                  <p className="text-yellow-700 mt-1">
                    {winner.voteCount} votes ({totalVotes > 0 ? ((winner.voteCount / totalVotes) * 100).toFixed(1) : 0}%)
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Chart and Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Vote Distribution
              </h3>
              <div className="space-y-4">
                {results.candidateResults && results.candidateResults.length > 0 ? (
                  results.candidateResults.map((candidate, index) => {
                    const percentage = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
                    const barWidth = maxVotes > 0 ? (candidate.voteCount / maxVotes) * 100 : 0;
                    const isWinner = index === 0 && candidate.voteCount > 0;
                    
                    return (
                      <div key={candidate.candidateId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {candidatePhotos[candidate.candidateId] ? (
                              <img
                                src={candidatePhotos[candidate.candidateId]}
                                alt={candidate.candidateName}
                                className="h-10 w-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <Award className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium text-gray-700 truncate">
                                {candidate.candidateNumber && `#${candidate.candidateNumber} `}
                                {candidate.candidateName}
                              </span>
                              {candidate.party && (
                                <span className="text-xs text-gray-500 whitespace-nowrap">({candidate.party})</span>
                              )}
                              {isWinner && (
                                <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900">
                              {candidate.voteCount} votes
                            </span>
                            <span className="text-sm text-gray-600">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className={`h-6 rounded-full ${
                              isWinner 
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                                : 'bg-gradient-to-r from-blue-400 to-blue-600'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 py-8">No votes recorded yet</p>
                )}
              </div>
            </motion.div>

            {/* Pie Chart Visualization */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Vote Share
              </h3>
              {results.candidateResults && results.candidateResults.length > 0 && totalVotes > 0 ? (
                <div className="space-y-4">
                  {results.candidateResults.map((candidate, index) => {
                    const percentage = (candidate.voteCount / totalVotes) * 100;
                    const colors = [
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-yellow-500',
                      'bg-purple-500',
                      'bg-red-500',
                      'bg-indigo-500',
                      'bg-pink-500',
                      'bg-teal-500'
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={candidate.candidateId} className="flex items-center gap-3">
                        {candidatePhotos[candidate.candidateId] ? (
                          <img
                            src={candidatePhotos[candidate.candidateId]}
                            alt={candidate.candidateName}
                            className="h-8 w-8 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
                          />
                        ) : (
                          <div className={`h-8 w-8 rounded-full ${color} flex-shrink-0`}></div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {candidate.candidateName}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className={`h-2 rounded-full ${color}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No votes recorded yet</p>
              )}
            </motion.div>
          </div>

          {/* Detailed Results Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Detailed Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Party
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.candidateResults && results.candidateResults.length > 0 ? (
                    results.candidateResults.map((candidate, index) => {
                      const percentage = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
                      const isWinner = index === 0 && candidate.voteCount > 0;
                      
                      return (
                        <tr
                          key={candidate.candidateId}
                          className={isWinner ? 'bg-yellow-50' : ''}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {index + 1}
                              </span>
                              {isWinner && (
                                <Trophy className="h-4 w-4 text-yellow-500 ml-2" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {candidate.candidateNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {candidatePhotos[candidate.candidateId] ? (
                                <img
                                  src={candidatePhotos[candidate.candidateId]}
                                  alt={candidate.candidateName}
                                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Award className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {candidate.candidateName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {candidate.party || 'Independent'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {candidate.voteCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {percentage.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No votes recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* No Selection State */}
      {!isLoadingResults && !results && selectedElection && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select an election to view results</p>
        </div>
      )}
    </div>
  );
};

export default Results;

