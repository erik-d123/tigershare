// src/pages/Home.jsx
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center max-w-3xl px-4">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-8">
          Share Rides with Fellow Tigers
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Find Princeton students heading to the same destination and split your travel costs.
          Perfect for airport runs, weekend trips, or any shared destination!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/rides"
            className="bg-princeton-orange text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-princeton-orange/90 transition-colors"
          >
            Find a Ride
          </Link>
          <Link
            to="/rides/create"
            className="bg-princeton-black text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-princeton-black/90 transition-colors"
          >
            Offer a Ride
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;