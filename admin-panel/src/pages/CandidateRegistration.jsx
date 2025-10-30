import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, AlertCircle, CheckCircle, User, Building } from 'lucide-react';
import Button from '../components/Button';
import ImageUploader from '../components/ImageUploader';

const CandidateRegistration = () => {
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    party: '',
    description: '',
    electionId: '',
    candidateNumber: ''
  });

  const [candidatePhoto, setCandidatePhoto] = useState(null);
  const [partyLogo, setPartyLogo] = useState(null);

  useEffect(() => {
    fetchElections();
    fetchCandidates();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/elections');
      if (response.ok) {
        const data = await response.json();
        setElections(data.filter(election => election.status !== 'COMPLETED'));
      } else {
        setError('Failed to fetch elections');
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
      setError('Failed to connect to server');
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/candidates');
      if (response.ok) {
        const data = await response.json();
        
        // Fetch photos for each candidate
        const candidatesWithPhotos = await Promise.all(
          data.map(async (candidate) => {
            try {
              // Fetch candidate photo
              const photoResponse = await fetch(`http://localhost:8080/api/candidates/${candidate.id}/photo`);
              let candidatePhoto = null;
              if (photoResponse.ok) {
                const photoData = await photoResponse.json();
                if (photoData.success) {
                  candidatePhoto = photoData.photoData;
                }
              }

              // Fetch party logo
              const logoResponse = await fetch(`http://localhost:8080/api/candidates/${candidate.id}/party-logo`);
              let partyLogo = null;
              if (logoResponse.ok) {
                const logoData = await logoResponse.json();
                if (logoData.success) {
                  partyLogo = logoData.logoData;
                }
              }

              return {
                ...candidate,
                candidatePhoto,
                partyLogo
              };
            } catch (error) {
              console.error(`Error fetching photos for candidate ${candidate.id}:`, error);
              return candidate;
            }
          })
        );

        setCandidates(candidatesWithPhotos);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
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

  const handleCandidatePhotoSelected = (file) => {
    setCandidatePhoto(file);
  };

  const handlePartyLogoSelected = (file) => {
    setPartyLogo(file);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      party: '',
      description: '',
      electionId: '',
      candidateNumber: ''
    });
    setCandidatePhoto(null);
    setPartyLogo(null);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Candidate name is required');
      return false;
    }
    if (!formData.party.trim()) {
      setError('Party/Affiliation is required');
      return false;
    }
    if (!formData.electionId) {
      setError('Please select an election');
      return false;
    }
    if (!candidatePhoto) {
      setError('Candidate photo is required');
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
      const candidateData = new FormData();
      candidateData.append('name', formData.name);
      candidateData.append('party', formData.party);
      candidateData.append('description', formData.description || '');
      candidateData.append('electionId', formData.electionId);
      candidateData.append('candidateNumber', formData.candidateNumber || '');
      candidateData.append('candidatePhoto', candidatePhoto);
      
      if (partyLogo) {
        candidateData.append('partyLogo', partyLogo);
      }

      const response = await fetch('http://localhost:8080/api/candidates/register', {
        method: 'POST',
        body: candidateData
      });

      if (response.ok) {
        setSuccess('Candidate registered successfully!');
        resetForm();
        fetchCandidates();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to register candidate');
      }
    } catch (error) {
      console.error('Error registering candidate:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const getElectionCandidates = (electionId) => {
    return candidates.filter(candidate => candidate.electionId === parseInt(electionId));
  };

  const selectedElection = elections.find(e => e.id === parseInt(formData.electionId));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Candidate Registration</h1>
        <p className="text-gray-600">Register candidates for elections</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <UserPlus className="h-6 w-6 mr-2" />
              Register New Candidate
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Election Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Election *
                </label>
                <select
                  name="electionId"
                  value={formData.electionId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose an election...</option>
                  {elections.map(election => (
                    <option key={election.id} value={election.id}>
                      {election.name} ({election.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Candidate Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Candidate Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter candidate's full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Candidate Number
                    </label>
                    <input
                      type="number"
                      name="candidateNumber"
                      value={formData.candidateNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Candidate number"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party/Affiliation *
                  </label>
                  <input
                    type="text"
                    name="party"
                    value={formData.party}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter party name or affiliation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description/Bio
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description about the candidate..."
                  />
                </div>
              </div>

              {/* Image Uploads */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Images
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUploader
                    label="Candidate Photo"
                    description="Upload candidate's photo"
                    onImageSelected={handleCandidatePhotoSelected}
                    disabled={isLoading}
                    required={true}
                  />

                  <ImageUploader
                    label="Party Logo"
                    description="Upload party logo (optional)"
                    onImageSelected={handlePartyLogoSelected}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  disabled={!formData.name || !formData.party || !formData.electionId || !candidatePhoto}
                  className="w-full"
                >
                  {isLoading ? 'Registering Candidate...' : 'Register Candidate'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Election Info & Existing Candidates */}
        <div className="space-y-6">
          {/* Selected Election Info */}
          {selectedElection && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Election</h3>
              <div className="space-y-2">
                <p className="font-medium">{selectedElection.name}</p>
                <p className="text-sm text-gray-600">{selectedElection.description}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedElection.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                    selectedElection.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedElection.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Start: {new Date(selectedElection.startDate).toLocaleString()}</p>
                  <p>End: {new Date(selectedElection.endDate).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Existing Candidates */}
          {formData.electionId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Existing Candidates
              </h3>
              
              {getElectionCandidates(formData.electionId).length === 0 ? (
                <p className="text-gray-500 text-sm">No candidates registered yet</p>
              ) : (
                <div className="space-y-3">
                  {getElectionCandidates(formData.electionId).map((candidate, index) => (
                    <div key={candidate.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {/* Candidate Photo */}
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {candidate.candidatePhoto ? (
                          <img
                            src={`data:image/jpeg;base64,${candidate.candidatePhoto}`}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Candidate Info */}
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {candidate.name}
                          {candidate.candidateNumber && (
                            <span className="text-gray-500 ml-1">({candidate.candidateNumber})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{candidate.party}</p>
                      </div>
                      
                      {/* Party Logo */}
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {candidate.partyLogo ? (
                          <img
                            src={`data:image/jpeg;base64,${candidate.partyLogo}`}
                            alt={`${candidate.party} logo`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateRegistration;