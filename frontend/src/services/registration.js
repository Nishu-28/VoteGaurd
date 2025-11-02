import { api } from './api';

export const registrationService = {
  registerVoter: async (voterData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('voterId', voterData.voterId);
      formData.append('fullName', voterData.fullName);
      formData.append('email', voterData.email);
      formData.append('extraField', voterData.extraField);
      formData.append('role', voterData.role || 'VOTER');
      
      // Add files
      formData.append('fingerprint', voterData.fingerprint);
      if (voterData.profilePhoto) {
        formData.append('profilePhoto', voterData.profilePhoto);
      }
      
      const response = await api.post('voters/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout for file uploads
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  getVoters: async (limit = 50, offset = 0) => {
    try {
      const response = await api.get(`voters?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get voters');
    }
  },

  getVoter: async (voterId) => {
    try {
      const response = await api.get(`voters/${voterId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get voter');
    }
  }
};

