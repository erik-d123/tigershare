// frontend/src/pages/CreateRide.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { convertToEST } from '../utils/dateUtils';

const CreateRide = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        destination: '',
        customDestination: '',
        departure_time: '',
        available_seats: '',
        total_fare: '',
        notes: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            // Convert to EST before submitting
            const estTime = convertToEST(formData.departure_time);

            const submitData = {
                destination: formData.destination === 'OTHER' ? formData.customDestination : formData.destination,
                departure_time: estTime,
                available_seats: parseInt(formData.available_seats),
                total_fare: parseFloat(formData.total_fare),
                notes: formData.notes
            };

            console.log('Submitting ride data:', submitData);
            await axios.post('/rides/create', submitData);
            navigate('/rides');
        } catch (error) {
            console.error('Create ride error:', error);
            setError(error.response?.data?.message || 'Error creating ride');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error when user makes changes
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Create a New Ride</h1>
                
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destination
                        </label>
                        <select
                            name="destination"
                            value={formData.destination}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-princeton-orange focus:border-princeton-orange"
                        >
                            <option value="">Select destination</option>
                            <option value="JFK Airport">JFK Airport</option>
                            <option value="Newark Airport">Newark Airport</option>
                            <option value="LaGuardia Airport">LaGuardia Airport</option>
                            <option value="Philadelphia Airport">Philadelphia Airport</option>
                            <option value="OTHER">Other (specify)</option>
                        </select>
                    </div>

                    {formData.destination === 'OTHER' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Specify Destination *
                            </label>
                            <input
                                type="text"
                                name="customDestination"
                                value={formData.customDestination}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-princeton-orange focus:border-princeton-orange"
                                placeholder="Enter your destination"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Departure Time (EST)
                        </label>
                        <input
                            type="datetime-local"
                            name="departure_time"
                            required
                            value={formData.departure_time}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-princeton-orange focus:border-princeton-orange"
                        />
                        <p className="mt-1 text-sm text-gray-500">All times are in Eastern Time (EST/EDT)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Available Seats
                        </label>
                        <input
                            type="number"
                            name="available_seats"
                            required
                            min="1"
                            max="8"
                            value={formData.available_seats}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-princeton-orange focus:border-princeton-orange"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Fare ($)
                        </label>
                        <input
                            type="number"
                            name="total_fare"
                            required
                            step="0.01"
                            min="0"
                            value={formData.total_fare}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-princeton-orange focus:border-princeton-orange"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-princeton-orange focus:border-princeton-orange"
                            placeholder="Add any additional information about the ride..."
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/rides')}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (formData.destination === 'OTHER' && !formData.customDestination)}
                            className="px-6 py-2 bg-princeton-orange text-white rounded-md hover:bg-princeton-orange/90 
                                     transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Ride'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRide;