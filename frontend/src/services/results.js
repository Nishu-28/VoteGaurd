import { api } from './api';

export const resultsService = {
  getResults: async () => {
    try {
      const response = await api.get('/results');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch results');
    }
  }
};






