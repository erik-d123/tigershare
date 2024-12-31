// frontend/src/components/NamePrompt.jsx
import { useState } from 'react';
import axios from 'axios';

const NamePrompt = ({ onComplete }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post(
                'http://localhost:3001/api/users/update-name',
                { name },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            onComplete();
        } catch (error) {
            setError(error.response?.data?.message || 'Error updating name');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to TigerShare!</h2>
                <p className="text-gray-600 mb-6">
                    Would you like to display your full name instead of your NetID? 
                    This will be shown when you post or join rides.
                </p>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-princeton-orange focus:border-princeton-orange"
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900"
                            disabled={loading}
                        >
                            Use NetID Instead
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-princeton-orange text-white rounded-md hover:bg-princeton-orange/90 disabled:opacity-50"
                            disabled={loading || !name.trim()}
                        >
                            {loading ? 'Saving...' : 'Save Name'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NamePrompt;