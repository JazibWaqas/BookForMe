import { useState } from 'react';
import VenuePreview from '../components/VenuePreview';
import '../styles/VendorBooking.css';

const initialData = {
  name: 'Arena Padel Court',
  image: 'https://placehold.co/400x200',
  location: 'DHA, Karachi',
  sportType: 'Padel',
  pricePerHour: 2000,
  amenities: ['Indoor', 'AC', 'Showers', 'Free Parking'],
  slots: [
    { time: '5:00 PM', available: true },
    { time: '6:00 PM', available: true },
    { time: '7:00 PM', available: false },
    { time: '8:00 PM', available: true },
  ],
  reviews: [
    { user: 'Ali', rating: 5, comment: 'Great court!' },
    { user: 'Sara', rating: 4, comment: 'Good lighting, will book again.' },
  ],
};

export default function VendorBooking() {
  const [data, setData] = useState(initialData);

  function handleChange(e) {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  function handleImageChange(e) {
    setData({ ...data, image: URL.createObjectURL(e.target.files[0]) });
  }

  function handleSlotChange(idx, value) {
    const slots = [...data.slots];
    slots[idx].time = value;
    setData({ ...data, slots });
  }

  return (
    <div className="vendor-booking-container">
      {/* Left: Edit Form */}
      <div className="edit-form-container">
        <h2 className="edit-form-title">Edit Venue Details</h2>
        <form className="edit-form">
          <label className="edit-label">Venue Name
            <input name="name" value={data.name} onChange={handleChange} className="edit-input" />
          </label>
          <label className="edit-label">Image
            <input type="file" accept="image/*" onChange={handleImageChange} className="edit-input-file" />
          </label>
          <label className="edit-label">Location
            <input name="location" value={data.location} onChange={handleChange} className="edit-input" />
          </label>
          <label className="edit-label">Sport Type
            <input name="sportType" value={data.sportType} onChange={handleChange} className="edit-input" />
          </label>
          <label className="edit-label">Price Per Hour
            <input name="pricePerHour" type="number" value={data.pricePerHour} onChange={handleChange} className="edit-input" />
          </label>
          <label className="edit-label">Amenities (comma separated)
            <input name="amenities" value={data.amenities.join(', ')} onChange={e => setData({ ...data, amenities: e.target.value.split(',').map(a => a.trim()) })} className="edit-input" />
          </label>
          <div>
            <div className="slots-title">Slots</div>
            <div className="slots-grid">
              {data.slots.map((slot, idx) => (
                <input key={idx} value={slot.time} onChange={e => handleSlotChange(idx, e.target.value)} className="slot-input" />
              ))}
            </div>
          </div>
        </form>
      </div>
      {/* Right: Live Preview */}
      <div className="preview-container">
        <h2 className="preview-title">Live Preview</h2>
        <VenuePreview data={data} />
      </div>
    </div>
  );
} 