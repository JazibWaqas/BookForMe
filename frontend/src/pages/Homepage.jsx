import { Link } from 'react-router-dom';
import '../styles/Homepage.css';

export default function Homepage() {
  return (
    <div className="homepage-container">
      <h1 className="homepage-title">Welcome to Slotify</h1>
      <Link to="/vendor/arena-padel-court" className="homepage-link">
        Go to Vendor Page
      </Link>
    </div>
  );
} 