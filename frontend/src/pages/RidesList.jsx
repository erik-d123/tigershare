// frontend/src/pages/RidesList.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';

const RidesList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [requestingRide, setRequestingRide] = useState(null);
    const [rideRequests, setRideRequests] = useState({});

    const { data: rides, isLoading, error, refetch } = useQuery({
        queryKey: ['rides', destination, date],
        queryFn: async () => {
            console.log('Starting rides fetch...');
            try {
                const params = new URLSearchParams();
                if (destination) params.append('destination', destination);
                if (date) params.append('date', date);
                
                const response = await axios.get('/rides', { params });
                console.log('Rides API response:', response.data);
                return response.data;
            } catch (err) {
                console.error('Error fetching rides:', err);
                throw err;
            }
        },
        refetchInterval: 60000 // Refetch every minute
    });

    // Fetch request status for each ride
    useEffect(() => {
        const fetchRequestStatuses = async () => {
            if (!user || !rides) return;
        
            const statuses = {};
            for (const ride of rides) {
                try {
                    const response = await axios.get(
                        `/rides/${ride.id}/request-status`
                    );
                    statuses[ride.id] = response.data.status;
                } catch (error) {
                    console.error('Error fetching request status:', error);
                }
            }
            setRideRequests(statuses);
        };

        fetchRequestStatuses();
    }, [rides, user]);

    const handleRequestJoin = async (rideId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setRequestingRide(rideId);
        try {
            await axios.post(
                `/rides/${rideId}/request`,
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            setRideRequests(prev => ({
                ...prev,
                [rideId]: 'pending'
            }));
            alert('Request sent! The host will be notified via email.');
        } catch (error) {
            alert(error.response?.data?.message || 'Error requesting to join ride');
        } finally {
            setRequestingRide(null);
        }
    };

    const getRequestButton = (ride) => {
        if (!user || user.netid === ride.creator_netid) {
            return null;
        }

        const requestStatus = rideRequests[ride.id];

        if (requestStatus === 'pending') {
            return (
                <button
                    disabled
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md cursor-not-allowed"
                >
                    Request Pending
                </button>
            );
        }

        if (requestStatus === 'approved') {
            return (
                <button
                    disabled
                    className="px-4 py-2 bg-green-500 text-white rounded-md cursor-not-allowed"
                >
                    Approved
                </button>
            );
        }

        return (
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
        );
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
                <div className="text-red-500">Error loading rides</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destination
                        </label>
                        <select
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-princeton-orange focus:border-princeton-orange"
                        >
                            <option value="">All Destinations</option>
                            <option value="JFK Airport">JFK Airport</option>
                            <option value="Newark Airport">Newark Airport</option>
                            <option value="LaGuardia Airport">LaGuardia Airport</option>
                            <option value="Philadelphia Airport">Philadelphia Airport</option>
                            <option value="OTHER">Other</option>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-princeton-orange focus:border-princeton-orange"
                        />
                    </div>
                </div>
            </div>

            {/* Rides List */}
            <div className="space-y-4">
                {!rides || rides.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No rides available matching your criteria</p>
                    </div>
                ) : (
                    rides.map((ride) => (
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
                                        {formatDateTime(ride.departure_time)}
                                    </p>
                                    <p className="text-gray-600">
                                        Posted by: {ride.creator_name || ride.creator_netid}
                                    </p>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {parseInt(ride.current_participants || 0)}/{parseInt(ride.available_seats)} seats available
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
                                {getRequestButton(ride)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RidesList;