// frontend/src/config/axios.js
import axios from 'axios';

const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
const baseURL = isDevelopment 
    ? 'http://localhost:3001'
    : import.meta.env.VITE_API_URL;

const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor
instance.interceptors.request.use(request => {
    const token = localStorage.getItem('token');
    if (token) {
        request.headers.Authorization = `Bearer ${token}`;
    }

    // Add /api prefix
    if (!request.url.startsWith('/api')) {
        request.url = `/api${request.url}`;
    }

    console.log('Request:', {
        method: request.method,
        url: request.url,
        baseURL: request.baseURL,
        headers: request.headers,
        data: request.data
    });

    return request;
}, error => {
    return Promise.reject(error);
});

// Add response interceptor
instance.interceptors.response.use(
    response => {
        console.log('Response:', {
            status: response.status,
            data: response.data,
            url: response.config.url
        });
        return response;
    },
    error => {
        console.error('Response Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            url: error.config?.url
        });
        return Promise.reject(error);
    }
);

export default instance;