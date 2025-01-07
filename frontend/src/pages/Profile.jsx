// frontend/src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myCreatedRides, setMyCreatedRides] = useState([]);
    const [myJoinedRides, setMyJoinedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserRides = async () => {
        try {
            if (!user || !user.id) return;
            
            console.log('Fetching rides for user:', user.id);
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const [createdResponse, joinedResponse] = await Promise.all([
                axios.get(`/api/rides/created-by/${user.id}`, { headers }),
                axios.get(`/api/rides/joined-by/${user.id}`, { headers })
            ]);

            console.log('Created rides response:', createdResponse.data);
            console.log('Joined rides response:', joinedResponse.data);

            setMyCreatedRides(createdResponse.data || []);
            setMyJoinedRides(joinedResponse.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching rides:', err);
            setError('Error fetching rides');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUserRides();
        }
    }, [user]);

    const handleCancelRide = async (rideId) => {
        if (!window.confirm('Are you sure you want to cancel this ride?')) {
            return;
        }

        try {
            await axios.post(
                `http://localhost:3001/api/rides/${rideId}/cancel`,
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            
            // Refresh the rides data
            await fetchUserRides();
            alert('Ride cancelled successfully');
        } catch (error) {
            console.error('Cancel ride error:', error);
            alert(error.response?.data?.message || 'Error canceling ride');
        }
    };

    const handleLeaveRide = async (rideId) => {
        if (!window.confirm('Are you sure you want to leave this ride?')) {
            return;
        }

        try {
            await axios.post(
                `http://localhost:3001/api/rides/${rideId}/leave`,
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            
            // Refresh the rides data
            await fetchUserRides();
            alert('Successfully left the ride');
        } catch (error) {
            console.error('Leave ride error:', error);
            alert(error.response?.data?.message || 'Error leaving ride');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-princeton-orange"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
                
                {/* Profile Information */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
                    <div className="bg-gray-50 p-4 rounded-md">
                        <p><span className="font-medium">NetID:</span> {user.netid}</p>
                        <p><span className="font-medium">Email:</span> {user.email}</p>
                        <p><span className="font-medium">Name:</span> {user.full_name}</p>
                    </div>
                </div>

                {/* Rides I'm Hosting */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Rides I'm Hosting</h2>
                    {myCreatedRides.length === 0 ? (
                        <p className="text-gray-500">You haven't created any rides yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {myCreatedRides.map(ride => (
                                <div key={ride.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{ride.destination}</h3>
                                            <p className="text-sm text-gray-600">
                                                {moment(ride.departure_time).format('MMMM D, YYYY h:mm A')}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {parseInt(ride.current_participants)}/{parseInt(ride.available_seats)} seats filled
                                            </p>
                                            {ride.total_fare && (
                                                <p className="text-sm text-gray-600">
                                                    Total fare: ${ride.total_fare}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600 mt-1">
                                                Status: <span className={`font-medium ${ride.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {ride.status}
                                                </span>
                                            </p>
                                        </div>
                                        {ride.status === 'active' && (
                                            <button
                                                onClick={() => handleCancelRide(ride.id)}
                                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                                            >
                                                Cancel Ride
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rides I've Joined */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Rides I've Joined</h2>
                    {myJoinedRides.length === 0 ? (
                        <p className="text-gray-500">You haven't joined any rides yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {myJoinedRides.map(ride => (
                                <div key={ride.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">{ride.destination}</h3>
                                            <p className="text-sm text-gray-600">
                                                {moment(ride.departure_time).format('MMMM D, YYYY h:mm A')}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Posted by: {ride.creator_name}
                                            </p>
                                            {ride.total_fare && (
                                                <p className="text-sm text-gray-600">
                                                    Total fare: ${ride.total_fare}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleLeaveRide(ride.id)}
                                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                                        >
                                            Leave Ride
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;