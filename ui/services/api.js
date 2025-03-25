import axios from 'axios';

// Example of an Axios instance configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  // ...other config
});

export default api; 