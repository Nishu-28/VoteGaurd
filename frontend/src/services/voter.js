import { api } from './api';

export const voterService = {
  getVoterProfilePhoto: async (voterId) => {
    try {
      const response = await api.get(`/voters/${voterId}/profile-photo`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get profile photo');
    }
  },

  getVoterInfo: async (voterId) => {
    try {
      const response = await api.get(`/voters/${voterId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get voter information');
    }
  }
};
