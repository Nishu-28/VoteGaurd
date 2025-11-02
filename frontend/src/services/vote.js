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
  getCandidates: async (electionId) => {
    try {
      const params = electionId ? { electionId } : {};
      const response = await api.get('/vote/candidates', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch candidates');
    }
  },

  castVote: async (candidateId, voterId, electionId) => {
    try {
      const formData = new FormData();
      formData.append('candidateId', candidateId.toString());
      formData.append('voterId', voterId.toString());
      if (electionId) {
        formData.append('electionId', electionId.toString());
      }

      const response = await api.post('/vote/cast', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Extract detailed error message from response
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to cast vote';
      console.error('Vote cast error:', error.response?.data);
      throw new Error(errorMessage);
    }
  }
};

