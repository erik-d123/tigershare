// frontend/src/config/axios.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_NODE_ENV === 'production' 
    ? '/api'
    : `${import.meta.env.VITE_API_URL}/api`;

console.log('Axios baseURL:', baseURL);
console.log('Environment:', import.meta.env.VITE_NODE_ENV);

const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor
instance.interceptors.request.use(request => {
    console.log('Starting Request:', {
        method: request.method,
        url: request.url,
        baseURL: request.baseURL,
        environment: import.meta.env.VITE_NODE_ENV
    });

    const token = localStorage.getItem('token');
    if (token) {
        request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
});

// Add response interceptor
instance.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.data);
        return response;
    },
    error => {
        console.error('Response Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            config: error.config
        });
        return Promise.reject(error);
    }
);

export default instance;