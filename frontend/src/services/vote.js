import { api } from './api';

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const voteService = {
  getCandidates: async () => {
    try {
      const response = await api.get('/vote/candidates');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch candidates');
    }
  },

  castVote: async (candidateId, voterId, stationCode) => {
    try {
      const formData = new FormData();
      formData.append('candidateId', candidateId.toString());
      formData.append('voterId', voterId.toString());
      formData.append('stationCode', stationCode);

      const response = await api.post('/vote/cast', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to cast vote');
    }
  }
};

