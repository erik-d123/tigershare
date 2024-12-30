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
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user's phone number
                const userResponse = await axios.get(
                    'http://localhost:3001/api/users/profile',
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }
                );
                setPhoneNumber(userResponse.data.phone_number || '');

                // Fetch rides
                const [createdResponse, joinedResponse] = await Promise.all([
                    axios.get(
                        `http://localhost:3001/api/rides/created-by/${user.id}`,
                        {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        }
                    ),
                    axios.get(
                        `http://localhost:3001/api/rides/joined-by/${user.id}`,
                        {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        }
                    )
                ]);

                setMyCreatedRides(createdResponse.data);
                setMyJoinedRides(joinedResponse.data);
            } catch (err) {
                setError('Error fetching data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const handleUpdatePhone = async () => {
        try {
            await axios.post(
                'http://localhost:3001/api/users/update-phone',
                { phoneNumber },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            setIsEditingPhone(false);
            setUpdateMessage('Phone number updated successfully!');
            setTimeout(() => setUpdateMessage(''), 3000);
        } catch (error) {
            setUpdateMessage('Error updating phone number');
            console.error(error);
        }
    };

    // ... rest of the Profile component code ...

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
                        
                        {/* Phone Number Section */}
                        <div className="mt-4">
                            <div className="flex items-center">
                                <span className="font-medium">Phone Number: </span>
                                {isEditingPhone ? (
                                    <div className="flex items-center ml-2">
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Enter phone number"
                                            className="px-2 py-1 border rounded-md"
                                        />
                                        <button
                                            onClick={handleUpdatePhone}
                                            className="ml-2 px-3 py-1 bg-princeton-orange text-white rounded-md text-sm"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setIsEditingPhone(false)}
                                            className="ml-2 px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center ml-2">
                                        <span>{phoneNumber || 'Not set'}</span>
                                        <button
                                            onClick={() => setIsEditingPhone(true)}
                                            className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                            {updateMessage && (
                                <p className={`mt-2 text-sm ${updateMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                                    {updateMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rest of the Profile component (Rides sections) ... */}
            </div>
        </div>
    );
};

export default Profile;