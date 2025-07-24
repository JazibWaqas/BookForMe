import { Link } from 'react-router-dom';

export default function Homepage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-500">
      <h1 className="text-3xl font-bold mb-6 text-red-700">Welcome to Slotify</h1>
      <Link to="/vendor/arena-padel-court" className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition font-semibold">
        Go to Vendor Page
      </Link>
    </div>
  );
} 