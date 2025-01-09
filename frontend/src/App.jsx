// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import RidesList from './pages/RidesList';
import CreateRide from './pages/CreateRide';
import AdminPanel from './pages/AdminPanel';
import NamePromptModal from './components/NamePromptModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-princeton-orange"></div>
            </div>
        );
    }
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    return children;
};

function AppContent() {
    const { user } = useAuth();
    const [showNamePrompt, setShowNamePrompt] = useState(false);

    useEffect(() => {
        const checkNamePrompt = async () => {
            if (user) {
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/users/needs-name`,
                        {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        }
                    );
                    setShowNamePrompt(response.data.needsName);
                } catch (error) {
                    console.error('Error checking name status:', error);
                }
            }
        };

        checkNamePrompt();
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            {showNamePrompt && user && (
                <NamePromptModal onClose={() => setShowNamePrompt(false)} />
            )}
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/rides" element={<RidesList />} />
                    <Route 
                        path="/rides/create" 
                        element={
                            <ProtectedRoute>
                                <CreateRide />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/login" element={<Login />} />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute>
                                <AdminPanel />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="/auth/success" element={<Login />} />
                    <Route path="/auth/callback" element={<Login />} />
                    <Route path="/auth/error" element={<Login />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;