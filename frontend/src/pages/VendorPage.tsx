import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import '../styles/VendorPage.css'

function VendorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'amenities' | 'reviews' | 'photos'>('amenities')

  // Mock vendor data based on ID - in real app, fetch from API
  const vendorData = useMemo(() => {
    const vendors: Record<string, any> = {
      '1': { 
        name: 'Elite Sports Complex', 
        location: 'Bandra West • 2.1 km', 
        rating: 4.8,
        reviews: 124,
        price: 1200,
        originalPrice: 1500,
        discount: 20,
        hours: '6:00 AM - 11:00 PM',
        description: 'Premium sports complex with state-of-the-art facilities and professional coaching available.',
        image: '/api/placeholder/600/400',
        amenities: [
          { name: 'Free WiFi', icon: '📶', available: true },
          { name: 'Parking', icon: '🚗', available: true },
          { name: 'Refreshments', icon: '☕', available: true },
          { name: 'Group Rates', icon: '👥', available: false }
        ],
        timeSlots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
        similarVenues: [
          { name: 'Champion Sports Complex', rating: 4.6, price: 1000, distance: '3.5 km', image: '/api/placeholder/100/100' },
          { name: 'Prime Court Complex', rating: 4.9, price: 1800, distance: '5.2 km', image: '/api/placeholder/100/100' }
        ]
      },
      '2': { 
        name: 'Champions Cricket Ground', 
        location: 'Gulshan-e-Iqbal • 4.2 km', 
        rating: 4.6,
        reviews: 89,
        price: 5000,
        originalPrice: 6000,
        discount: 17,
        hours: '5:00 AM - 10:00 PM',
        description: 'Professional cricket ground with natural grass and modern facilities.',
        image: '/api/placeholder/600/400',
        amenities: [
          { name: 'Parking', icon: '🚗', available: true },
          { name: 'Refreshments', icon: '☕', available: true },
          { name: 'Changing Rooms', icon: '🚿', available: true },
          { name: 'Equipment Rental', icon: '🏏', available: true }
        ],
        timeSlots: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
        similarVenues: [
          { name: 'Green Field Cricket Club', rating: 4.7, price: 4500, distance: '2.8 km', image: '/api/placeholder/100/100' },
          { name: 'Royal Cricket Academy', rating: 4.9, price: 5500, distance: '6.1 km', image: '/api/placeholder/100/100' }
        ]
      }
    }
    return vendors[id || '1'] || vendors['1']
  }, [id])

  const calculateTotal = () => {
    const basePrice = vendorData.price
    const discount = (basePrice * vendorData.discount) / 100
    const serviceFee = 50
    return basePrice - discount + serviceFee
  }

  return (
    <>
      <Header />
      <div className="vendor-page">
        {/* Back Button */}
        <div className="back-button-container">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Venues
          </button>
        </div>

        {/* Main Content */}
        <div className="vendor-main-layout">
          {/* Left Column - Venue Details */}
          <div className="venue-details">
            {/* Venue Image */}
            <div className="venue-image-container">
              <img src={vendorData.image} alt={vendorData.name} className="venue-image" />
              <div className="image-overlay">
                <button className="overlay-button share-button">📤</button>
                <button className="overlay-button favorite-button">❤️</button>
              </div>
              <div className="discount-tag">20% OFF Today</div>
            </div>

            {/* Venue Info */}
            <div className="venue-info">
              <h1 className="venue-title">{vendorData.name}</h1>
              <p className="venue-subtitle">Sports Court</p>
              
              <div className="venue-meta">
                <div className="price-section">
                  <span className="current-price">₹{vendorData.price}</span>
                  <span className="original-price">₹{vendorData.originalPrice}</span>
                  <span className="price-unit">per hour</span>
                </div>
                
                <div className="rating-section">
                  <span className="rating">⭐ {vendorData.rating}</span>
                  <span className="reviews">({vendorData.reviews} reviews)</span>
                </div>
                
                <div className="location-section">
                  <span className="location">📍 {vendorData.location}</span>
                </div>
                
                <div className="hours-section">
                  <span className="hours">🕐 {vendorData.hours}</span>
                </div>
              </div>
              
              <p className="venue-description">{vendorData.description}</p>

              {/* Tabs */}
              <div className="tabs-container">
                <button 
                  className={`tab ${activeTab === 'amenities' ? 'active' : ''}`}
                  onClick={() => setActiveTab('amenities')}
                >
                  Amenities
                </button>
                <button 
                  className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews
                </button>
                <button 
                  className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('photos')}
                >
                  Photos
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'amenities' && (
                  <div className="amenities-grid">
                    {vendorData.amenities.map((amenity: any, index: number) => (
                      <div key={index} className={`amenity-card ${amenity.available ? 'available' : 'unavailable'}`}>
                        <span className="amenity-icon">{amenity.icon}</span>
                        <span className="amenity-name">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'reviews' && (
                  <div className="reviews-content">
                    <p>Reviews content would go here...</p>
                  </div>
                )}
                
                {activeTab === 'photos' && (
                  <div className="photos-content">
                    <p>Photo gallery would go here...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="booking-section">
            {/* Time Slots */}
            <div className="booking-card">
              <h3 className="booking-title">Available Time Slots</h3>
              <div className="time-slots-grid">
                {vendorData.timeSlots.map((slot: string) => (
                  <button
                    key={slot}
                    className={`time-slot ${selectedTimeSlot === slot ? 'selected' : ''}`}
                    onClick={() => setSelectedTimeSlot(selectedTimeSlot === slot ? null : slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Summary */}
            <div className="booking-summary">
              <div className="summary-item">
                <span>Court rental (1 hour)</span>
                <span>₹{vendorData.price}</span>
              </div>
              <div className="summary-item discount">
                <span>Discount ({vendorData.discount}%)</span>
                <span>-₹{(vendorData.price * vendorData.discount) / 100}</span>
              </div>
              <div className="summary-item">
                <span>Service fee</span>
                <span>₹50</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>₹{calculateTotal()}</span>
              </div>
              
              <button className="book-now-button">Book Now</button>
              
              <div className="contact-buttons">
                <button className="contact-button">📞 Call</button>
                <button className="contact-button">✉️ Email</button>
              </div>
            </div>

            {/* Similar Venues */}
            <div className="similar-venues">
              <h3>Similar Venues</h3>
              {vendorData.similarVenues.map((venue: any, index: number) => (
                <div key={index} className="similar-venue-card">
                  <img src={venue.image} alt={venue.name} className="venue-thumbnail" />
                  <div className="venue-details-small">
                    <h4 className="venue-name-small">{venue.name}</h4>
                    <div className="venue-rating-small">⭐ {venue.rating}</div>
                    <div className="venue-price-small">₹{venue.price}/hr</div>
                    <div className="venue-distance-small">{venue.distance}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default VendorPage


