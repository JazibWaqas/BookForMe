import { useState } from 'react';
import VenuePreview from '../components/VenuePreview';

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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row gap-8 p-8">
      {/* Left: Edit Form */}
      <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-xl p-8 mb-8 md:mb-0 border border-blue-100">
        <h2 className="text-2xl font-extrabold mb-6 text-blue-700">Edit Venue Details</h2>
        <form className="flex flex-col gap-6">
          <label className="font-semibold text-blue-700">Venue Name
            <input name="name" value={data.name} onChange={handleChange} className="block w-full border border-blue-200 rounded-lg px-4 py-2 mt-2 focus:outline-blue-400" />
          </label>
          <label className="font-semibold text-blue-700">Image
            <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full mt-2" />
          </label>
          <label className="font-semibold text-blue-700">Location
            <input name="location" value={data.location} onChange={handleChange} className="block w-full border border-blue-200 rounded-lg px-4 py-2 mt-2 focus:outline-blue-400" />
          </label>
          <label className="font-semibold text-blue-700">Sport Type
            <input name="sportType" value={data.sportType} onChange={handleChange} className="block w-full border border-blue-200 rounded-lg px-4 py-2 mt-2 focus:outline-blue-400" />
          </label>
          <label className="font-semibold text-blue-700">Price Per Hour
            <input name="pricePerHour" type="number" value={data.pricePerHour} onChange={handleChange} className="block w-full border border-blue-200 rounded-lg px-4 py-2 mt-2 focus:outline-blue-400" />
          </label>
          <label className="font-semibold text-blue-700">Amenities (comma separated)
            <input name="amenities" value={data.amenities.join(', ')} onChange={e => setData({ ...data, amenities: e.target.value.split(',').map(a => a.trim()) })} className="block w-full border border-blue-200 rounded-lg px-4 py-2 mt-2 focus:outline-blue-400" />
          </label>
          <div>
            <div className="font-semibold text-blue-700 mb-2">Slots</div>
            <div className="grid grid-cols-2 gap-2">
              {data.slots.map((slot, idx) => (
                <input key={idx} value={slot.time} onChange={e => handleSlotChange(idx, e.target.value)} className="block w-full border border-green-200 rounded-lg px-4 py-2 mb-2 focus:outline-green-400" />
              ))}
            </div>
          </div>
        </form>
      </div>
      {/* Right: Live Preview */}
      <div className="w-full md:w-1/2">
        <h2 className="text-2xl font-extrabold mb-6 text-green-700">Live Preview</h2>
        <VenuePreview data={data} />
      </div>
    </div>
  );
} 