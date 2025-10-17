import { biometricApi } from './api';

export const biometricService = {
  verifyFingerprint: async (fingerprintFile, voterId = 'DEMO_VOTER') => {
    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprintFile);
      formData.append('voter_id', voterId);
      
      // Use enhanced verification endpoint
      const response = await biometricApi.post('/enhanced/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      // Don't fallback to basic verification - enhanced should handle all cases
      throw new Error(error.response?.data?.message || 'Enhanced fingerprint verification failed');
    }
  },

  enrollFingerprint: async (fingerprintFile, voterId) => {
    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprintFile);
      formData.append('voter_id', voterId);
      
      // Use enhanced enrollment endpoint
      const response = await biometricApi.post('/enhanced/enroll', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      // Don't fallback to basic enrollment - enhanced should handle all cases
      throw new Error(error.response?.data?.message || 'Enhanced fingerprint enrollment failed');
    }
  },

  // Enhanced methods for production use
  enhancedVerifyFingerprint: async (fingerprintFile, voterId) => {
    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprintFile);
      formData.append('voter_id', voterId);
      
      const response = await biometricApi.post('/enhanced/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Enhanced fingerprint verification failed');
    }
  },

  enhancedEnrollFingerprint: async (fingerprintFile, voterId) => {
    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprintFile);
      formData.append('voter_id', voterId);
      
      const response = await biometricApi.post('/enhanced/enroll', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Enhanced fingerprint enrollment failed');
    }
  },

  getVerificationHistory: async (voterId, limit = 10) => {
    try {
      const response = await biometricApi.get(`/enhanced/history/${voterId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get verification history');
    }
  },

  getDatabaseStats: async () => {
    try {
      const response = await biometricApi.get('/enhanced/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get database stats');
    }
  }
};
