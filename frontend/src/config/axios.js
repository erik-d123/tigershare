import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.NODE_ENV === 'production' 
        ? '' 
        : 'http://localhost:3001',
});

// Add request interceptor for logging
instance.interceptors.request.use(request => {
    console.log('Starting Request:', request.method, request.url);
    return request;
});

// Add response interceptor for logging
instance.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.data);
        return response;
    },
    error => {
        console.error('Response Error:', error);
        return Promise.reject(error);
    }
);

export default instance;