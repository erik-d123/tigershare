// frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../config/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get('/auth/verify');
                    console.log('Verify response:', response);
                    setUser(response.data.user);
                } catch (error) {
                    console.error('Token verification error:', error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        verifyToken();
    }, []);

    const handleAuthCallback = async (token) => {
        try {
            if (!token) {
                throw new Error('No token provided');
            }

            const response = await axios.get('/auth/verify');
            console.log('Auth callback response:', response);
            setUser(response.data.user);
            return response.data.user;
        } catch (error) {
            console.error('Auth callback error:', error);
            localStorage.removeItem('token');
            setUser(null);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        handleAuthCallback,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;