import { api } from './api';

export const stationService = {
  getAllStations: async () => {
    try {
      const response = await api.get('/stations');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch stations');
    }
  },

  getUnlockedStations: async () => {
    try {
      const response = await api.get('/stations/unlocked');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch unlocked stations');
    }
  },

  createStation: async (stationData) => {
    try {
      const response = await api.post('/stations', stationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create station');
    }
  },

  lockStation: async (stationCode) => {
    try {
      const response = await api.put(`/stations/${stationCode}/lock`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to lock station');
    }
  },

  unlockStation: async (stationCode) => {
    try {
      const response = await api.put(`/stations/${stationCode}/unlock`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to unlock station');
    }
  },

  getStation: async (stationCode) => {
    try {
      const response = await api.get(`/stations/${stationCode}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch station');
    }
  }
};




