// frontend/src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, handleAuthCallback } = useAuth();
    const [formData, setFormData] = useState({ email: '', name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Check if alternative login is enabled
    const showAlternativeLogin = import.meta.env.VITE_ENABLE_ALTERNATIVE_LOGIN === 'true';

    // Handle CAS callback
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

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/rides');
        }
    }, [user, navigate]);

    const handleSimpleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simple validation
        if (!formData.email.trim() || !formData.name.trim()) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/auth/simple-login', formData);
            const { token } = response.data;
            
            localStorage.setItem('token', token);
            await handleAuthCallback(token);
            navigate('/rides');
        } catch (error) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCASLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/cas/login`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-princeton-orange"></div>
            </div>
        );
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

                {/* Princeton CAS Login Button */}
                <div className="mb-8">
                    <button
                        onClick={handleCASLogin}
                        disabled={loading}
                        className="w-full bg-princeton-orange text-white py-3 rounded-md font-medium 
                            hover:bg-princeton-orange/90 transition-colors mb-2 disabled:opacity-50"
                    >
                        Princeton CAS Login
                    </button>
                    <p className="text-sm text-center text-gray-500">
                        Recommended for Princeton University members
                    </p>
                </div>

                {/* Alternative Login Section */}
                {showAlternativeLogin && (
                    <>
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or</span>
                            </div>
                        </div>

                        <form onSubmit={handleSimpleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                             focus:ring-princeton-orange focus:border-princeton-orange"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                             focus:ring-princeton-orange focus:border-princeton-orange"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.email.trim() || !formData.name.trim()}
                                className="w-full bg-gray-800 text-white py-3 rounded-md font-medium 
                                    hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Signing in...' : 'Sign in with Email'}
                            </button>

                            <p className="text-sm text-center text-gray-500">
                                Alternative sign-in option for testing
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;