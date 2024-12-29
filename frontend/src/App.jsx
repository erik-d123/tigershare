// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import RidesList from './pages/RidesList';
import CreateRide from './pages/CreateRide';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <div className="min-h-screen bg-gray-50">
                        <Navbar />
                        <main className="container mx-auto px-4 py-8">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/rides" element={<RidesList />} />
                                <Route path="/rides/create" element={<CreateRide />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/auth/success" element={<Login />} />
                                <Route path="/auth/error" element={<Login />} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;