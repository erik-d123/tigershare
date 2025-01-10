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

    useEffect(() => {
        if (user) {
            navigate('/rides');
        }
    }, [user, navigate]);

    const handleSimpleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('Attempting simple login with:', formData);
            const response = await axios.post('/api/auth/simple-login', formData);
            console.log('Login response:', response.data);
            
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
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
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
                <button
                    onClick={handleCASLogin}
                    disabled={loading}
                    className="w-full bg-princeton-orange text-white py-3 rounded-md font-medium 
                        hover:bg-princeton-orange/90 transition-colors mb-6"
                >
                    Princeton CAS Login
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                </div>

                {/* Simple Email Login Form */}
                <form onSubmit={handleSimpleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                   focus:ring-princeton-orange focus:border-princeton-orange"
                            placeholder="Enter your email"
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
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                   focus:ring-princeton-orange focus:border-princeton-orange"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.email || !formData.name}
                        className="w-full bg-gray-800 text-white py-3 rounded-md font-medium 
                               hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign in with Email'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;