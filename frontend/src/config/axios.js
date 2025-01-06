// frontend/src/config/axios.js
import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for logging
instance.interceptors.request.use(request => {
    console.log('Starting Request:', request.method, request.url);
    if (localStorage.getItem('token')) {
        request.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }
    return request;
});

// Add response interceptor for logging
instance.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.data);
        return response;
    },
    error => {
        console.error('Response Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });
        return Promise.reject(error);
    }
);

export default instance;