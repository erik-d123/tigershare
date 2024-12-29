// src/pages/Login.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        // Handle the callback from CAS
        const handleCASCallback = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            
            if (token) {
                try {
                    await login({ token });
                    navigate('/rides');
                } catch (error) {
                    console.error('Login error:', error);
                }
            }
        };

        if (location.pathname === '/auth/success') {
            handleCASCallback();
        }
    }, [location, login, navigate]);

    const handleLogin = () => {
        // Redirect to backend CAS login route
        window.location.href = 'http://localhost:3001/api/auth/cas/login';
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="max-w-md w-full px-6 py-8 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold text-center mb-8">
                    Login to TigerShare
                </h2>
                <button
                    onClick={handleLogin}
                    className="w-full bg-princeton-orange text-white py-3 rounded-md font-medium hover:bg-princeton-orange/90 transition-colors"
                >
                    Login with Princeton NetID
                </button>
            </div>
        </div>
    );
};

export default Login;