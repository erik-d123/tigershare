// frontend/src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, handleAuthCallback } = useAuth();
    const [netid, setNetid] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const authMethod = import.meta.env.VITE_AUTH_METHOD || 'CAS';

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

        try {
            const response = await axios.post('/auth/simple-login', { netid });
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

                {/* Simple Login Form - Only shown when SIMPLE auth is enabled */}
                {authMethod === 'SIMPLE' && (
                    <>
                        <form onSubmit={handleSimpleLogin} className="space-y-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Princeton NetID
                                </label>
                                <input
                                    type="text"
                                    value={netid}
                                    onChange={(e) => setNetid(e.target.value)}
                                    placeholder="Enter your NetID"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                                             focus:ring-princeton-orange focus:border-princeton-orange"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !netid.trim()}
                                className={`w-full bg-princeton-orange text-white py-3 rounded-md font-medium 
                                    ${loading || !netid.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-princeton-orange/90'} 
                                    transition-colors`}
                            >
                                {loading ? 'Logging in...' : 'Login with NetID'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or</span>
                            </div>
                        </div>
                    </>
                )}

                {/* CAS Login Button - Always shown, but primary when CAS auth is enabled */}
                <button
                    onClick={handleCASLogin}
                    disabled={loading}
                    className={`w-full py-3 rounded-md font-medium transition-colors disabled:opacity-50
                        ${authMethod === 'CAS' 
                            ? 'bg-princeton-orange text-white hover:bg-princeton-orange/90' 
                            : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                >
                    Princeton CAS Login
                </button>

                {/* Development Note */}
                {import.meta.env.DEV && (
                    <p className="mt-4 text-sm text-center text-gray-500">
                        Auth Method: {authMethod}
                        {authMethod === 'SIMPLE' && <><br />Use any NetID for testing</>}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;