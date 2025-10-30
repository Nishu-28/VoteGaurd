import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';

const Elections = () => {
  const [elections, setElections] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingElection, setEditingElection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchElections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/elections');
      if (response.ok) {
        const data = await response.json();
        setElections(data);
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
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {new Date(election.startDate).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>End: {new Date(election.endDate).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Elections;