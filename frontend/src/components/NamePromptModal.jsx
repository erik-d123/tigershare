// frontend/src/components/NamePromptModal.jsx
import { useState } from 'react';
import axios from 'axios';

const NamePromptModal = ({ onClose }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(
                'http://localhost:3001/api/users/set-name',
                { name },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            window.location.reload(); // Reload to update displayed name
        } catch (error) {
            setError('Failed to update name. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full m-4">
                <h2 className="text-2xl font-bold mb-4">Welcome to TigerShare!</h2>
                <p className="text-gray-600 mb-6">
                    Would you like to use your full name instead of your NetID? 
                    This name will be displayed when you post or join rides.
                </p>

                {error && (
                    <div className="mb-4 text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-princeton-orange focus:border-princeton-orange"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Keep NetID
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="px-6 py-2 bg-princeton-orange text-white rounded 
                                     hover:bg-princeton-orange/90 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Use Full Name'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NamePromptModal;