import { api } from './api';

export const electionService = {
  validateElectionCode: async (electionCode) => {
    try {
      const response = await api.post('/elections/validate-code', { electionCode });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid election code');
    }
  },

  getElectionByCode: async (electionCode) => {
    try {
      const response = await api.get(`/elections/code/${electionCode}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Election not found');
    }
  },

  getActiveElections: async () => {
    try {
      const response = await api.get('/elections/active');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch elections');
    }
  },

  getOngoingElections: async () => {
    try {
      const response = await api.get('/elections/ongoing');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ongoing elections');
    }
  },

  getAllElections: async () => {
    try {
      const response = await api.get('/elections');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch elections');
    }
  },

  createElection: async (electionData) => {
    try {
      const response = await api.post('/elections', electionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create election');
    }
  },

  updateElection: async (id, electionData) => {
    try {
      const response = await api.put(`/elections/${id}`, electionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update election');
    }
  },

  deleteElection: async (id) => {
    try {
      await api.delete(`/elections/${id}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete election');
    }
  },

  updateElectionStatus: async (id, status) => {
    try {
      const response = await api.put(`/elections/${id}/status`, null, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update election status');
    }
  },

  getVoterEligibleElections: async (voterId) => {
    try {
      const response = await api.get(`/elections/voter/${voterId}/eligible`);
      return response.data.elections || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch eligible elections');
    }
  },

  generateOTP: async (electionId) => {
    try {
      const response = await api.post(`/elections/${electionId}/generate-otp`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate OTP');
    }
  }
};
