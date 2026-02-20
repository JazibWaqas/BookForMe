import { CheckCircle, Calendar, Clock, MapPin, Phone, Mail, Download, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import type { Vendor } from '../types';

interface BookingSuccessScreenProps {
  bookingId: number;
  venue: Vendor;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  onNavigateHome: () => void;
  onViewProfile: () => void;
}

export function BookingSuccessScreen({
  bookingId,
  venue,
  date,
  time,
  customerName,
  customerPhone,
  onNavigateHome,
  onViewProfile,
}: BookingSuccessScreenProps) {
  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddToCalendar = () => {
    // Create iCal/Google Calendar event
    const eventDate = new Date(date + 'T' + time);
    const title = `Booking at ${venue.business_name}`;
    const details = `Your booking has been confirmed!\nBooking ID: ${bookingId}`;
    const location = venue.address;

    // Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${eventDate
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0]}Z&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;

    window.open(googleCalendarUrl, '_blank');
  };

  const handleDownloadReceipt = () => {
    // In a real app, this would generate a PDF
    alert('Receipt download feature will be implemented with backend integration');
  };

  return (
    <div className="p-6 min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h1 className="text-3xl mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your booking has been successfully confirmed. We've sent you a confirmation message.
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Booking ID */}
            <div className="text-center pb-4 mb-4 border-b">
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="text-2xl font-mono tracking-wider mt-1">#{bookingId.toString().padStart(6, '0')}</p>
            </div>

            {/* Venue Info */}
            <div className="flex items-start gap-4 pb-4 mb-4 border-b">
              <img
                src={venue.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=200'}
                alt={venue.business_name}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{venue.business_name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin size={14} />
                  {venue.address}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone size={14} />
                  {venue.phone}
                </p>
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{time}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Customer Details</p>
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-muted-foreground" />
                  <span>{customerPhone}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button variant="outline" onClick={handleAddToCalendar} className="w-full">
            <Calendar className="mr-2" size={18} />
            Add to Calendar
          </Button>
          <Button variant="outline" onClick={handleDownloadReceipt} className="w-full">
            <Download className="mr-2" size={18} />
            Download Receipt
          </Button>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={onNavigateHome} variant="outline" size="lg" className="w-full">
            <Home className="mr-2" size={18} />
            Back to Home
          </Button>
          <Button onClick={onViewProfile} size="lg" className="w-full">
            View My Bookings
          </Button>
        </div>

        {/* WhatsApp Confirmation Notice */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="text-green-600" size={20} />
              </div>
              <div>
                <h4 className="font-medium text-green-900 mb-1">Confirmation Sent!</h4>
                <p className="text-sm text-green-800">
                  We've sent a WhatsApp confirmation to <strong>{customerPhone}</strong> with all the booking details.
                  Please check your messages.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Important Notes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Please arrive 10 minutes before your scheduled time</li>
            <li>• Bring a valid ID for verification</li>
            <li>• Cancellations must be made at least 24 hours in advance</li>
            <li>• Contact the venue directly for any changes or queries</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
