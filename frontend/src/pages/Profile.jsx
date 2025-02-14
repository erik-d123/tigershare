// frontend/src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myCreatedRides, setMyCreatedRides] = useState([]);
    const [myJoinedRides, setMyJoinedRides] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [selectedRideParticipants, setSelectedRideParticipants] = useState(null);
    const [viewingParticipants, setViewingParticipants] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Redirect if not logged in
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Initialize with empty arrays in case of error
                setMyCreatedRides([]);
                setMyJoinedRides([]);
                setPendingRequests([]);

                // Fetch all data
                const [createdResponse, joinedResponse, pendingResponse] = await Promise.all([
                    axios.get(`/rides/created-by/${user.id}`),
                    axios.get(`/rides/joined-by/${user.id}`),
                    axios.get('/rides/pending-requests')
                ]);

                setMyCreatedRides(createdResponse.data || []);
                setMyJoinedRides(joinedResponse.data || []);
                setPendingRequests(pendingResponse.data || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Error loading profile data');
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate]);

    const handleCancelRide = async (rideId) => {
        if (!window.confirm('Are you sure you want to cancel this ride?')) {
            return;
        }
    
        try {
            await axios.post(`/rides/${rideId}/cancel`);
            // Refresh the data
            const response = await axios.get(`/rides/created-by/${user.id}`);
            setMyCreatedRides(response.data || []);
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
            await axios.post(`/rides/${rideId}/leave`);
            // Refresh joined rides
            const response = await axios.get(`/rides/joined-by/${user.id}`);
            setMyJoinedRides(response.data || []);
            alert('Successfully left the ride');
        } catch (error) {
            console.error('Leave ride error:', error);
            alert(error.response?.data?.message || 'Error leaving ride');
        }
    };

    const handleViewParticipants = async (rideId) => {
        try {
            const response = await axios.get(`/rides/${rideId}/participants`);
            setSelectedRideParticipants(response.data);
            setViewingParticipants(true);
        } catch (error) {
            console.error('Error fetching participants:', error);
            alert('Error fetching participants');
        }
    };

    const handleRequestResponse = async (rideId, requesterId, action) => {
        try {
            await axios.get(`/rides/${rideId}/${action}/${requesterId}`);
            
            // Refresh pending requests and created rides
            const [pendingResponse, createdResponse] = await Promise.all([
                axios.get('/rides/pending-requests'),
                axios.get(`/rides/created-by/${user.id}`)
            ]);
            
            setPendingRequests(pendingResponse.data || []);
            setMyCreatedRides(createdResponse.data || []);
            
            alert(`Request ${action === 'approve' ? 'approved' : 'denied'} successfully`);
        } catch (error) {
            console.error(`Error ${action}ing request:`, error);
            alert(error.response?.data?.message || `Error ${action}ing request`);
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600">Please log in to view your profile.</div>
            </div>
        );
    }

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

                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Requests</h2>
                        <div className="space-y-4">
                            {pendingRequests.map(request => (
                                <div key={request.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{request.requester_name} ({request.requester_netid})</p>
                                            <p className="text-gray-600">
                                                Requesting to join ride to {request.destination}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Departure: {formatDateTime(request.departure_time)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Requested: {formatDateTime(request.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleRequestResponse(request.ride_id, request.requester_id, 'approve')}
                                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleRequestResponse(request.ride_id, request.requester_id, 'deny')}
                                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                                            >
                                                Deny
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                                                {formatDateTime(ride.departure_time)}
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
                                            <button
                                                onClick={() => handleViewParticipants(ride.id)}
                                                className="text-princeton-orange hover:text-princeton-orange/90 text-sm mt-2"
                                            >
                                                View Participants
                                            </button>
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
                                                {formatDateTime(ride.departure_time)}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Posted by: {ride.creator_name || ride.creator_netid}
                                            </p>
                                            {ride.total_fare && (
                                                <p className="text-sm text-gray-600">
                                                    Total fare: ${ride.total_fare}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => handleViewParticipants(ride.id)}
                                                className="text-princeton-orange hover:text-princeton-orange/90 text-sm mt-2"
                                            >
                                                View Participants
                                            </button>
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

            {/* Participants Modal */}
            {viewingParticipants && selectedRideParticipants && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Ride Participants</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {selectedRideParticipants.map(participant => (
                                <div key={participant.netid} className="p-2 bg-gray-50 rounded">
                                    <p className="font-medium">{participant.full_name}</p>
                                    <p className="text-sm text-gray-600">{participant.netid}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setViewingParticipants(false);
                                setSelectedRideParticipants(null);
                            }}
                            className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;