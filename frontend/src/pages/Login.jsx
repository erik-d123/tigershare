// frontend/src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, handleAuthCallback } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const processAuthCallback = async () => {
            if (location.pathname === '/auth/success') {
                const params = new URLSearchParams(location.search);
                const token = params.get('token');
                
                if (token) {
                    try {
                        localStorage.setItem('token', token);
                        await handleAuthCallback(token);
                        navigate('/rides');
                    } catch (error) {
                        console.error('Auth callback error:', error);
                        setError('Authentication failed');
                    }
                }
            }
        };

        processAuthCallback();
    }, [location, handleAuthCallback, navigate]);

    useEffect(() => {
        if (user) {
            navigate('/rides');
        }
    }, [user, navigate]);

    const handleCASLogin = () => {
        window.location.href = '/api/auth/cas/login';
    };

    const handleTestLogin = async () => {
        try {
            setLoading(true);
            console.log('Starting test login request...');
            const response = await axios.post('/api/auth/test-login');  // Updated path
            console.log('Test login response:', response.data);
            
            const { token } = response.data;
            if (token) {
                localStorage.setItem('token', token);
                await handleAuthCallback(token);
                navigate('/rides');
            }
        } catch (error) {
            console.error('Test login error details:', error.response?.data || error.message);
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold text-center mb-8">
                    Login to TigerShare
                </h2>

                {error && (
                    <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCASLogin}
                    className="w-full bg-princeton-orange text-white py-3 rounded-md font-medium 
                        hover:bg-princeton-orange/90 transition-colors mb-4"
                >
                    Login with Princeton NetID
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                </div>

                <button
                    onClick={handleTestLogin}
                    disabled={loading}
                    className={`w-full bg-gray-800 text-white py-3 rounded-md font-medium 
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'} 
                        transition-colors`}
                >
                    Development Login
                </button>
            </div>
        </div>
    );
};

export default Login;