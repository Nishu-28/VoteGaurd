import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Vote, Calendar, BarChart3, TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { resultsAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVoters: 0,
    activeVoters: 0,
    totalElections: 0,
    activeElections: 0,
    totalCandidates: 0,
    totalVotes: 0,
    recentRegistrations: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch multiple endpoints in parallel
      const [votersRes, electionsRes, candidatesRes] = await Promise.all([
        fetch('http://localhost:8080/api/voters'),
        fetch('http://localhost:8080/api/elections'),
        fetch('http://localhost:8080/api/candidates')
      ]);

      const votersResult = votersRes.ok ? await votersRes.json() : [];
      const elections = electionsRes.ok ? await electionsRes.json() : [];
      const candidates = candidatesRes.ok ? await candidatesRes.json() : [];
      
      // Get total votes from results API
      let totalVotes = 0;
      try {
        const resultsResponse = await resultsAPI.getSummary();
        if (resultsResponse.data && resultsResponse.data.totalVotes !== undefined) {
          totalVotes = resultsResponse.data.totalVotes;
        }
      } catch (error) {
        console.warn('Failed to fetch total votes from results API:', error);
        // Fallback: count votes from voters (not ideal but better than 0)
        totalVotes = Array.isArray(votersResult) 
          ? votersResult.filter(v => v.hasVoted).length 
          : 0;
      }

      // Extract the data array from the voters response
      const voters = Array.isArray(votersResult) ? votersResult : (votersResult.data || []);

      // Calculate statistics
      const activeVoters = voters.filter(v => v.isActive !== false).length;
      const activeElections = elections.filter(e => e.status === 'ACTIVE').length;
      const recentRegistrations = voters
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);

      setStats({
        totalVoters: voters.length,
        activeVoters,
        totalElections: elections.length,
        activeElections,
        totalCandidates: candidates.length,
        totalVotes: totalVotes,
        recentRegistrations
      });
      
      setError('');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Real-time voting system overview</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : null}
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
        >
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Voters</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalVoters}</dd>
                  <dd className="text-sm text-gray-500">{stats.activeVoters} active</dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Elections</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalElections}</dd>
                  <dd className="text-sm text-gray-500">{stats.activeElections} active</dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Candidates</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalCandidates}</dd>
                  <dd className="text-sm text-gray-500">registered</dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Vote className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Votes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalVotes}</dd>
                  <dd className="text-sm text-gray-500">cast so far</dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/elections"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Elections</h3>
                <p className="text-sm text-gray-500">Create and manage elections</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/candidate-registration"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Candidates</h3>
                <p className="text-sm text-gray-500">Register election candidates</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/voter-registration"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Register Voter</h3>
                <p className="text-sm text-gray-500">Add new voters to system</p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/voters-list"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Voters List</h3>
                <p className="text-sm text-gray-500">Manage registered voters</p>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                <p className="text-sm text-gray-500">View system reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Voter Registrations</h3>
          {stats.recentRegistrations.length > 0 ? (
            <div className="space-y-3">
              {stats.recentRegistrations.map((voter, index) => (
                <motion.div
                  key={voter.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {voter.fullName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{voter.fullName || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">ID: {voter.voterId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      voter.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {voter.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {voter.createdAt ? new Date(voter.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-500">Loading registrations...</span>
                </div>
              ) : (
                <p className="text-gray-500">No recent registrations</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;