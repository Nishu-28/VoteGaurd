import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include authentication
api.interceptors.request.use(
  (config) => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.token) {
          // Add JWT token as Authorization header
          config.headers['Authorization'] = `Bearer ${session.token}`;
        }
      } catch (error) {
        console.error('Error parsing admin session:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Authentication failed, clear session and redirect to login
      localStorage.removeItem('adminSession');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const electionsAPI = {
  // Get all elections
  getAll: () => api.get('/elections'),
  
  // Get election by ID
  getById: (id) => api.get(`/elections/${id}`),
  
  // Create new election
  create: (electionData) => api.post('/elections', electionData),
  
  // Update election
  update: (id, electionData) => api.put(`/elections/${id}`, electionData),
  
  // Delete election
  delete: (id) => api.delete(`/elections/${id}`),
  
  // Get election results
  getResults: (id) => api.get(`/elections/${id}/results`),
};

export const votersAPI = {
  // Get all voters
  getAll: () => api.get('/voters'),
  
  // Get voter by ID
  getById: (id) => api.get(`/voters/${id}`),
  
  // Register new voter
  register: (voterData) => {
    const formData = new FormData();
    Object.keys(voterData).forEach(key => {
      if (voterData[key] !== null && voterData[key] !== undefined) {
        formData.append(key, voterData[key]);
      }
    });
    
    return axios.post(`${API_BASE_URL}/voter-registration/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update voter
  update: (id, voterData) => api.put(`/voters/${id}`, voterData),
  
  // Delete voter
  delete: (id) => api.delete(`/voters/${id}`),
  
  // Add voter to election
  addToElection: (voterId, electionId) => 
    api.post(`/voters/${voterId}/elections/${electionId}`),
  
  // Remove voter from election
  removeFromElection: (voterId, electionId) => 
    api.delete(`/voters/${voterId}/elections/${electionId}`),
};

export const candidatesAPI = {
  // Get candidates for an election
  getByElection: (electionId) => api.get(`/elections/${electionId}/candidates`),
  
  // Create candidate for an election
  create: (electionId, candidateData) => 
    api.post(`/elections/${electionId}/candidates`, candidateData),
  
  // Update candidate
  update: (id, candidateData) => api.put(`/candidates/${id}`, candidateData),
  
  // Delete candidate
  delete: (id) => api.delete(`/candidates/${id}`),
  
  // Get candidate photo
  getPhoto: (id) => api.get(`/candidates/${id}/photo`),
};

export const statisticsAPI = {
  // Get dashboard statistics
  getDashboard: () => api.get('/statistics/dashboard'),
  
  // Get voter statistics
  getVoterStats: () => api.get('/statistics/voters'),
  
  // Get election statistics
  getElectionStats: (electionId) => api.get(`/statistics/elections/${electionId}`),
};

export const resultsAPI = {
  // Get general voting results
  getSummary: () => api.get('/results/summary'),
  
  // Get election-specific results
  getElectionResults: (electionId) => api.get(`/results/election/${electionId}`),
};

export default {
  elections: electionsAPI,
  voters: votersAPI,
  candidates: candidatesAPI,
  statistics: statisticsAPI,
  results: resultsAPI,
};