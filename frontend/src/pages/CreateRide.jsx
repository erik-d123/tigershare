// frontend/src/pages/CreateRide.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CreateRide = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        destination: '',
        departure_time: '',
        available_seats: '',
        notes: ''
    });
    const [error, setError] = useState('');

    // Redirect to login if not authenticated
    if (!user) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/rides', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            navigate('/rides');
        } catch (error) {
            setError(error.response?.data?.message || 'Error creating ride');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create a New Ride</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                        Destination
                    </label>
                    <input
                        type="text"
                        id="destination"
                        name="destination"
                        required
                        value={formData.destination}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="e.g., JFK Airport"
                    />
                </div>

                <div>
                    <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700">
                        Departure Time
                    </label>
                    <input
                        type="datetime-local"
                        id="departure_time"
                        name="departure_time"
                        required
                        value={formData.departure_time}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                </div>

                <div>
                    <label htmlFor="available_seats" className="block text-sm font-medium text-gray-700">
                        Available Seats
                    </label>
                    <input
                        type="number"
                        id="available_seats"
                        name="available_seats"
                        required
                        min="1"
                        max="8"
                        value={formData.available_seats}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes (Optional)
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Add any additional information about the ride..."
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => navigate('/rides')}
                        className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-princeton-orange text-white px-6 py-2 rounded-md hover:bg-princeton-orange/90 transition-colors"
                    >
                        Create Ride
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateRide;