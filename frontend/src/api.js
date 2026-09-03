import axios from 'axios';

// Use the current origin in production. Vite proxies /api to the backend in development.
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
