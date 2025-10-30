import axios from 'axios';

const BIOMETRIC_API_BASE_URL = 'http://localhost:8001';

// Create axios instance for biometric service
const biometricApi = axios.create({
  baseURL: BIOMETRIC_API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for biometric operations
});

export const adminBiometricService = {
  /**
   * Verify admin fingerprint for authentication
   */
  verifyAdminFingerprint: async (fingerprintFile, adminId) => {
    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprintFile);
      formData.append('voter_id', `ADMIN_${adminId}`); // Prefix admin IDs
      
      const response = await biometricApi.post('/enhanced/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        verified: response.data.verified,
        confidence: response.data.confidence,
        message: response.data.message,
        data: response.data
      };
    } catch (error) {
      console.error('Admin fingerprint verification error:', error);
      return {
        success: false,
        verified: false,
        message: error.response?.data?.message || 'Biometric verification failed',
        error: error.message
      };
    }
  },

  /**
   * Enroll admin fingerprint for first-time setup
   */
  enrollAdminFingerprint: async (fingerprintFile, adminId) => {
    try {
      const formData = new FormData();
      formData.append('fingerprint', fingerprintFile);
      formData.append('voter_id', `ADMIN_${adminId}`); // Prefix admin IDs
      
      const response = await biometricApi.post('/enhanced/enroll', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        enrolled: response.data.success,
        templateId: response.data.template_id,
        message: response.data.message,
        data: response.data
      };
    } catch (error) {
      console.error('Admin fingerprint enrollment error:', error);
      return {
        success: false,
        enrolled: false,
        message: error.response?.data?.message || 'Biometric enrollment failed',
        error: error.message
      };
    }
  },

  /**
   * Get biometric enrollment status for admin
   */
  getAdminBiometricStatus: async (adminId) => {
    try {
      const response = await biometricApi.get(`/enhanced/status/ADMIN_${adminId}`);
      
      return {
        success: true,
        enrolled: response.data.enrolled,
        enrollmentDate: response.data.enrollment_date,
        lastVerification: response.data.last_verification,
        verificationCount: response.data.verification_count,
        data: response.data
      };
    } catch (error) {
      console.error('Admin biometric status error:', error);
      return {
        success: false,
        enrolled: false,
        message: error.response?.data?.message || 'Failed to get biometric status',
        error: error.message
      };
    }
  },

  /**
   * Delete admin fingerprint template
   */
  deleteAdminFingerprint: async (adminId) => {
    try {
      const response = await biometricApi.delete(`/enhanced/delete/ADMIN_${adminId}`);
      
      return {
        success: true,
        deleted: response.data.success,
        message: response.data.message,
        data: response.data
      };
    } catch (error) {
      console.error('Admin fingerprint deletion error:', error);
      return {
        success: false,
        deleted: false,
        message: error.response?.data?.message || 'Failed to delete fingerprint',
        error: error.message
      };
    }
  },

  /**
   * Get admin verification history
   */
  getAdminVerificationHistory: async (adminId, limit = 10) => {
    try {
      const response = await biometricApi.get(`/enhanced/history/ADMIN_${adminId}?limit=${limit}`);
      
      return {
        success: true,
        history: response.data.history || [],
        totalCount: response.data.total_count || 0,
        data: response.data
      };
    } catch (error) {
      console.error('Admin verification history error:', error);
      return {
        success: false,
        history: [],
        message: error.response?.data?.message || 'Failed to get verification history',
        error: error.message
      };
    }
  },

  /**
   * Check biometric service health
   */
  checkServiceHealth: async () => {
    try {
      const response = await biometricApi.get('/health');
      
      return {
        success: true,
        healthy: response.status === 200,
        version: response.data.version,
        uptime: response.data.uptime,
        data: response.data
      };
    } catch (error) {
      console.error('Biometric service health check error:', error);
      return {
        success: false,
        healthy: false,
        message: 'Biometric service is not available',
        error: error.message
      };
    }
  }
};

export default adminBiometricService;