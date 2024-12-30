// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import RidesList from './pages/RidesList';
import CreateRide from './pages/CreateRide';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000,
        },
    },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    return children;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <AuthProvider>
                    <div className="min-h-screen bg-gray-50">
                        <Navbar />
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
                                <Route path="/auth/success" element={<Login />} />
                                <Route path="/auth/callback" element={<Login />} />
                                <Route path="/auth/error" element={<Login />} />
                            </Routes>
                        </main>
                    </div>
                </AuthProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;