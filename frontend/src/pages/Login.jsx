// frontend/src/pages/Login.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { handleAuthCallback } = useAuth();

    // For development: Use test login instead of CAS
    const handleTestLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3001/api/auth/test-login');
            const { token, user } = response.data;
            
            if (token) {
                localStorage.setItem('token', token);
                await handleAuthCallback(token);
                navigate('/rides');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold text-center mb-8">
                    Login to TigerShare
                </h2>
                {/* Development login button */}
                <button
                    onClick={handleTestLogin}
                    className="w-full bg-princeton-orange text-white py-3 rounded-md font-medium hover:bg-princeton-orange/90 transition-colors mb-4"
                >
                    Development Login (Test User)
                </button>
                <p className="mt-4 text-sm text-gray-600 text-center">
                    Use test login for development purposes
                </p>
            </div>
        </div>
    );
};

export default Login;