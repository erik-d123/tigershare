// src/pages/RidesList.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import moment from 'moment';

const RidesList = () => {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

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

  const handleJoinRide = async (rideId) => {
    try {
      await axios.post(`http://localhost:3001/api/rides/${rideId}/join`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Refetch rides after joining
      queryClient.invalidateQueries(['rides']);
    } catch (error) {
      console.error('Error joining ride:', error);
      alert(error.response?.data?.message || 'Error joining ride');
    }
  };

  if (isLoading) return <div className="text-center">Loading rides...</div>;
  if (error) return <div className="text-center text-red-500">Error loading rides</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Rides</h1>
      
      {/* Search filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search destination..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="px-4 py-2 border rounded-md flex-1"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 border rounded-md"
        />
      </div>

      {/* Rides list */}
      <div className="space-y-4">
        {rides?.map((ride) => (
          <div key={ride.id} className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{ride.destination}</h3>
                <p className="text-gray-600">
                  {moment(ride.departure_time).format('MMMM D, YYYY h:mm A')}
                </p>
                <p className="text-gray-600">
                  Posted by: {ride.creator_name} ({ride.creator_netid})
                </p>
                <p className="text-gray-600">
                  Available seats: {ride.available_seats - ride.current_participants}
                </p>
                {ride.notes && (
                  <p className="text-gray-600 mt-2">Notes: {ride.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleJoinRide(ride.id)}
                className="bg-princeton-orange text-white px-4 py-2 rounded-md hover:bg-princeton-orange/90"
                disabled={ride.available_seats <= ride.current_participants}
              >
                Join Ride
              </button>
            </div>
          </div>
        ))}
        
        {rides?.length === 0 && (
          <div className="text-center text-gray-500">
            No rides found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
};

export default RidesList;