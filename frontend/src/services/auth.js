import { api } from './api';
import axios from 'axios';

// Create a separate API instance for public endpoints (no auth token)
const publicApi = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (voterId, extraField, fingerprintFile, electionCode = null) => {
    try {
      const formData = new FormData();
      formData.append('voterId', voterId);
      formData.append('extraField', extraField);
      formData.append('fingerprint', fingerprintFile);
      if (electionCode) {
        formData.append('electionCode', electionCode);
      }

      const response = await publicApi.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Provide more specific error messages
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Login failed';
        if (errorMessage.includes('Invalid voter credentials')) {
          throw new Error('Invalid Voter ID or extra field. Please check your credentials and try again.');
        } else if (errorMessage.includes('Fingerprint verification failed')) {
          throw new Error('Fingerprint verification failed. Please ensure you are using the same fingerprint from registration.');
        } else if (errorMessage.includes('already voted') || errorMessage.includes('already cast your vote')) {
          throw new Error('You have already cast your vote in this election. Thank you for participating!');
        } else if (errorMessage.includes('inactive')) {
          throw new Error('Your voter account is inactive. Please contact the administrator.');
        }
        throw new Error(errorMessage);
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!error.response) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  registerFingerprint: async (voterId, fingerprintFile) => {
    try {
      const formData = new FormData();
      formData.append('voterId', voterId);
      formData.append('fingerprint', fingerprintFile);

      const response = await api.post('/auth/register-fingerprint', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Fingerprint registration failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        voterId: payload.sub,
        role: payload.role,
        exp: payload.exp
      };
    } catch (error) {
      return null;
    }
  }
};
