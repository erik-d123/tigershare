// frontend/src/pages/RidesList.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RidesList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [requestingRide, setRequestingRide] = useState(null);

    const { data: rides, isLoading, error } = useQuery({
        queryKey: ['rides', destination, date],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (destination) params.append('destination', destination);
            if (date) params.append('date', date);
            
            const response = await axios.get(`http://localhost:3001/api/rides?${params}`);
            return response.data;
        }
    });

    const handleRequestJoin = async (rideId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setRequestingRide(rideId);
        try {
            const response = await axios.post(
                `http://localhost:3001/api/rides/${rideId}/request`,
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            alert('Request sent! The ride host will be notified and you\'ll receive a text if approved.');
        } catch (error) {
            alert(error.response?.data?.message || 'Error requesting to join ride');
        } finally {
            setRequestingRide(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-princeton-orange"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-500">Error loading rides: {error.message}</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Available Rides</h1>
                    {user && (
                        <button
                            onClick={() => navigate('/rides/create')}
                            className="bg-princeton-orange text-white px-4 py-2 rounded-md hover:bg-princeton-orange/90 transition-colors"
                        >
                            Post a Ride
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destination
                        </label>
                        <select
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-princeton-orange focus:border-princeton-orange"
                        >
                            <option value="">All Destinations</option>
                            <option value="JFK Airport">JFK Airport</option>
                            <option value="Newark Airport">Newark Airport</option>
                            <option value="LaGuardia Airport">LaGuardia Airport</option>
                            <option value="Philadelphia Airport">Philadelphia Airport</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-princeton-orange focus:border-princeton-orange"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {rides?.map((ride) => (
                        <div 
                            key={ride.id} 
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {ride.destination}
                                    </h3>
                                    <p className="text-gray-600">
                                        {moment(ride.departure_time).format('MMMM D, YYYY h:mm A')}
                                    </p>
                                    <p className="text-gray-600">
                                        Posted by: {ride.creator_name} ({ride.creator_netid})
                                    </p>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {parseInt(ride.current_participants) + 1}/{parseInt(ride.available_seats) + 1} seats filled
                                            </span>
                                            {ride.total_fare && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Total fare: ${ride.total_fare}
                                                </span>
                                            )}
                                        </div>
                                        {ride.notes && (
                                            <p className="text-sm text-gray-600">
                                                Notes: {ride.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {user && user.netid !== ride.creator_netid && (
                                    <button
                                        onClick={() => handleRequestJoin(ride.id)}
                                        disabled={requestingRide === ride.id}
                                        className={`px-4 py-2 rounded-md text-white 
                                            ${requestingRide === ride.id
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-princeton-orange hover:bg-princeton-orange/90'} 
                                            transition-colors`}
                                    >
                                        {requestingRide === ride.id ? 'Requesting...' : 'Request to Join'}
                                    </button>
                                )}
                            </div>
                            <div className="mt-4 text-sm text-gray-500">
                                Posted {moment(ride.created_at).fromNow()}
                            </div>
                        </div>
                    ))}
                    {(!rides || rides.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                            No rides available matching your criteria
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RidesList;