// frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Validate token and get user info
            axios.get('http://localhost:3001/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => {
                    setUser(response.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async () => {
        // Redirect to Princeton CAS login
        window.location.href = 'http://localhost:3001/api/auth/cas/login';
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const handleAuthCallback = async (token) => {
        if (token) {
            localStorage.setItem('token', token);
            const response = await axios.get('http://localhost:3001/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
            return response.data;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, handleAuthCallback }}>
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