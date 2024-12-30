// frontend/src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-princeton-orange shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center">
                            <span className="text-white text-xl font-bold">TigerShare</span>
                        </Link>
                    </div>
                    
                    <div className="flex items-center">
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link
                                    to="/rides"
                                    className="text-white hover:bg-princeton-black/10 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Find Rides
                                </Link>
                                {user && (
                                    <Link
                                        to="/rides/create"
                                        className="text-white hover:bg-princeton-black/10 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Post a Ride
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/profile"
                                    className="text-white hover:bg-princeton-black/10 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Profile
                                </Link>
                                <span className="text-white text-sm">{user.netid}</span>
                                <button
                                    onClick={logout}
                                    className="text-white hover:bg-princeton-black/10 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="text-white hover:bg-princeton-black/10 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;