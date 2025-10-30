import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Edit2, Eye, Users, Download, RefreshCw, UserCheck, UserX } from 'lucide-react';
import Button from '../components/Button';
import VoterEditModal from '../components/VoterEditModal';

const VotersList = () => {
  const [voters, setVoters] = useState([]);
  const [filteredVoters, setFilteredVoters] = useState([]);
  const [elections, setElections] = useState([]);
  const [voterPhotos, setVoterPhotos] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [electionFilter, setElectionFilter] = useState('all');
  const [votingStatusFilter, setVotingStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [votersPerPage] = useState(20);

  // Selected voter for editing
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchVoters();
    fetchElections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [voters, searchTerm, statusFilter, electionFilter, votingStatusFilter, roleFilter]);

  const fetchVoters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/voters');
      if (response.ok) {
        const data = await response.json();
        setVoters(data);
        // Fetch profile photos for all voters
        await fetchVoterPhotos(data);
      } else {
        setError('Failed to fetch voters');
      }
    } catch (error) {
      console.error('Error fetching voters:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

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

  const fetchVoterPhotos = async (votersList) => {
    const photos = {};
    
    // Fetch photos for all voters in parallel
    const photoPromises = votersList.map(async (voter) => {
      try {
        const response = await fetch(`http://localhost:8080/voters/${voter.voterId}/profile-photo`);
        if (response.ok) {
          const data = await response.json();
          photos[voter.voterId] = data.photoData;
        }
      } catch (error) {
        console.log(`No photo found for voter ${voter.voterId}`);
      }
    });

    await Promise.all(photoPromises);
    setVoterPhotos(photos);
  };

  const applyFilters = () => {
    let filtered = [...voters];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(voter =>
        voter.voterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(voter => 
        statusFilter === 'active' ? voter.isActive : !voter.isActive
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(voter => voter.role === roleFilter.toUpperCase());
    }

    // Voting status filter
    if (votingStatusFilter !== 'all') {
      filtered = filtered.filter(voter => 
        votingStatusFilter === 'voted' ? voter.hasVoted : !voter.hasVoted
      );
    }

    // Election eligibility filter
    if (electionFilter !== 'all') {
      filtered = filtered.filter(voter => 
        voter.eligibleElections && voter.eligibleElections.includes(electionFilter)
      );
    }

    setFilteredVoters(filtered);
    setCurrentPage(1);
  };

  const handleEditVoter = (voter) => {
    setSelectedVoter(voter);
    setShowEditModal(true);
  };

  const handleSaveVoter = (updatedData) => {
    // Update the voter in the local state
    setVoters(prev => prev.map(voter => 
      voter.id === updatedData.id ? { ...voter, ...updatedData } : voter
    ));
    setShowEditModal(false);
    setSelectedVoter(null);
  };

  const handleViewVoter = (voter) => {
    // For now, just show an alert with voter details
    alert(`Voter Details:\nID: ${voter.voterId}\nName: ${voter.fullName}\nEmail: ${voter.email}\nStatus: ${voter.isActive ? 'Active' : 'Inactive'}\nHas Voted: ${voter.hasVoted ? 'Yes' : 'No'}`);
  };

  const exportToCSV = () => {
    const headers = ['Voter ID', 'Full Name', 'Email', 'Role', 'Status', 'Has Voted', 'Created At'];
    const csvData = filteredVoters.map(voter => [
      voter.voterId,
      voter.fullName,
      voter.email,
      voter.role,
      voter.isActive ? 'Active' : 'Inactive',
      voter.hasVoted ? 'Yes' : 'No',
      new Date(voter.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voters_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const indexOfLastVoter = currentPage * votersPerPage;
  const indexOfFirstVoter = indexOfLastVoter - votersPerPage;
  const currentVoters = filteredVoters.slice(indexOfFirstVoter, indexOfLastVoter);
  const totalPages = Math.ceil(filteredVoters.length / votersPerPage);

  const getElectionName = (electionId) => {
    const election = elections.find(e => e.id === parseInt(electionId));
    return election ? election.name : `Election ${electionId}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voters Management</h1>
          <p className="text-gray-600">View and manage registered voters</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={fetchVoters}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={exportToCSV}
            variant="secondary"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6 mb-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, name, or email..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="voter">Voter</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Voting Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voting Status</label>
            <select
              value={votingStatusFilter}
              onChange={(e) => setVotingStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="voted">Has Voted</option>
              <option value="not-voted">Not Voted</option>
            </select>
          </div>

          {/* Election Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Election</label>
            <select
              value={electionFilter}
              onChange={(e) => setElectionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Elections</option>
              {elections.map(election => (
                <option key={election.id} value={election.id.toString()}>
                  {election.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {currentVoters.length} of {filteredVoters.length} voters
          </p>
          <Button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setRoleFilter('all');
              setVotingStatusFilter('all');
              setElectionFilter('all');
            }}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
      </motion.div>

      {/* Voters Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading voters...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : currentVoters.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No voters found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voter Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eligible Elections
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentVoters.map((voter) => (
                    <tr key={voter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {voterPhotos[voter.voterId] ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={`data:image/jpeg;base64,${voterPhotos[voter.voterId]}`}
                                alt={voter.fullName}
                                onError={(e) => {
                                  // Fallback to initials if image fails to load
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ${voterPhotos[voter.voterId] ? 'hidden' : ''}`}
                            >
                              <span className="text-sm font-medium text-blue-600">
                                {voter.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{voter.fullName}</div>
                            <div className="text-sm text-gray-500">ID: {voter.voterId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{voter.email}</div>
                        <div className="text-sm text-gray-500">{voter.extraField}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            voter.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {voter.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            voter.hasVoted ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {voter.hasVoted ? 'Voted' : 'Not Voted'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            voter.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {voter.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {voter.eligibleElections && voter.eligibleElections.length > 0 ? (
                            <div className="space-y-1">
                              {voter.eligibleElections.slice(0, 2).map(electionId => (
                                <div key={electionId} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {getElectionName(electionId)}
                                </div>
                              ))}
                              {voter.eligibleElections.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{voter.eligibleElections.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No elections</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(voter.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewVoter(voter)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditVoter(voter)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Voter"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{indexOfFirstVoter + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastVoter, filteredVoters.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{filteredVoters.length}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === index + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Edit Modal */}
      <VoterEditModal
        voter={selectedVoter}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedVoter(null);
        }}
        onSave={handleSaveVoter}
      />
    </div>
  );
};

export default VotersList;