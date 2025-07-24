import { useState } from 'react';

const TABS = [
  { key: 'slots', label: 'Available Slots' },
  { key: 'details', label: 'Details' },
  { key: 'reviews', label: 'Reviews' },
];

export default function VenuePreview({ data }) {
  const [tab, setTab] = useState('slots');

  return (
    <div className="bg-black rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-8 border-b bg-gray-50">
        <img src={data.image} alt="Venue" className="rounded-lg shadow-md w-40 h-40 object-cover border" />
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-blue-700">{data.name}</h1>
          <div className="text-gray-600 text-lg">{data.location} <span className="mx-2">•</span> {data.sportType}</div>
          <div className="text-green-600 font-bold text-lg">Rs. {data.pricePerHour}/hr</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.amenities.map((a, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">{a}</span>
            ))}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex border-b bg-white sticky top-0 z-10">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 font-bold text-md transition border-b-2 ${tab === t.key ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="p-8">
        {tab === 'slots' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Available Slots</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {data.slots.map((slot, i) => (
                <div key={i} className={`rounded-lg p-4 text-center font-bold shadow ${slot.available ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                  {slot.time}
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 left-0 w-full flex justify-center z-40">
              <button className="bg-orange-500 text-white px-10 py-4 rounded-t-2xl shadow-2xl text-xl font-bold hover:bg-orange-600 transition">Book Now</button>
            </div>
          </div>
        )}
        {tab === 'details' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Details</h2>
            <ul className="text-gray-700 list-disc list-inside space-y-2">
              {data.amenities.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
        {tab === 'reviews' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-orange-600">Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.reviews.map((r, i) => (
                <div key={i} className="bg-white border rounded-lg p-4 shadow flex flex-col gap-2">
                  <div className="text-yellow-500 text-lg">{'⭐️'.repeat(r.rating)}</div>
                  <div className="font-semibold text-blue-700">{r.user}</div>
                  <div className="text-gray-700">{r.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 