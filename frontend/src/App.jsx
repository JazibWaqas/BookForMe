import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import VendorBooking from './pages/VendorBooking';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>    
        <Route path="/" element={<Homepage />} />
        <Route path="/vendor/:vendorId" element={<VendorBooking />} />
      </Routes>
    </Router>
  );
}

export default App
