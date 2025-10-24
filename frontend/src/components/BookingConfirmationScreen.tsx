import { useState } from 'react';
import { Calendar, Clock, MapPin, User, Phone, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useCreateBooking } from '../hooks/useBookings';
import type { Vendor, Service } from '../types';

interface BookingConfirmationScreenProps {
  venue: Vendor;
  service: Service;
  selectedDate: string;
  selectedTime: string;
  onBack: () => void;
  onSuccess: (bookingId: number) => void;
}

export function BookingConfirmationScreen({
  venue,
  service,
  selectedDate,
  selectedTime,
  onBack,
  onSuccess,
}: BookingConfirmationScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    whatsappConfirmation: true,
  });

  const { createBooking, loading } = useCreateBooking();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await createBooking({
        vendor_id: venue.id,
        service_id: service.id,
        date: selectedDate,
        time: selectedTime,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email,
        send_whatsapp_confirmation: formData.whatsappConfirmation,
      });

      if (response.success && response.booking_id) {
        onSuccess(response.booking_id);
      }
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2" size={18} />
            Back to Venue
          </Button>
          <h1 className="text-3xl">Confirm Your Booking</h1>
          <p className="text-muted-foreground mt-2">
            Review your booking details and complete your reservation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Booking Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Venue */}
                <div className="flex items-start gap-3 pb-4 border-b">
                  <img
                    src={venue.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400'}
                    alt={venue.business_name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{venue.business_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin size={14} />
                      {venue.location}
                    </p>
                  </div>
                </div>

                {/* Service */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="font-medium">{service.service_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">PKR {service.price}</p>
                    <p className="text-sm text-muted-foreground">{service.duration_minutes} min</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-3 py-2">
                  <Calendar className="text-primary" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(selectedDate)}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3 py-2">
                  <Clock className="text-primary" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Total Amount</p>
                    <p className="font-semibold text-xl">PKR {service.price}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Policy */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Cancellation Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Free cancellation up to 24 hours before booking</li>
                  <li>• 50% refund for cancellations within 24 hours</li>
                  <li>• No refund for no-shows</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-muted-foreground" size={18} />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-muted-foreground" size={18} />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+92 300 1234567"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* WhatsApp Confirmation */}
                  <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
                    <Checkbox
                      id="whatsapp"
                      checked={formData.whatsappConfirmation}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, whatsappConfirmation: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="whatsapp"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                      >
                        <MessageCircle size={16} className="text-green-600" />
                        Send WhatsApp Confirmation
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Get instant booking confirmation on WhatsApp
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Confirm Booking'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By confirming, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
