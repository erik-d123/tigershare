// frontend/src/pages/AdminPanel.jsx
import { useState } from 'react';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // List of admin NetIDs
    const adminNetIds = ['ed1783'];

    const handleResetRides = async () => {
        if (!window.confirm('Are you sure you want to reset all rides? This action cannot be undone.')) {
            return;
        }
        
        setLoading(true);
        setMessage('');
        
        try {
            const response = await axios.post('/admin/reset-all-rides');
            setMessage('Successfully reset all rides');
            console.log('Reset response:', response.data);
        } catch (error) {
            console.error('Reset error:', error);
            setMessage('Error resetting rides: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Redirect non-admin users
    if (!user || !adminNetIds.includes(user.netid)) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-princeton-orange hover:text-princeton-orange/90"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

            {message && (
                <div className={`p-4 mb-6 rounded-md ${
                    message.includes('Error') 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                }`}>
                    {message}
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Ride Management</h2>
                
                <div className="space-y-4">
                    <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Warning: Resetting rides will remove all existing rides, 
                                    participants, and requests. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleResetRides}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Reset All Rides'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;