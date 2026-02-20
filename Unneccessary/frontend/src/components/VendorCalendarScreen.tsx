import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { mockData } from '../services/api';
import type { Booking } from '../types';

interface VendorCalendarScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function VendorCalendarScreen({ onNavigate }: VendorCalendarScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [filterSource, setFilterSource] = useState<string>('all');

  // Mock bookings - in real app, fetch from API based on selected date range
  const bookings: Booking[] = [
    ...mockData.bookings,
    {
      id: 2,
      slot_id: 2,
      vendor_id: 1,
      customer_name: 'Sara Ahmed',
      customer_phone: '+923002222222',
      customer_email: 'sara@example.com',
      service_id: 1,
      date: '2025-10-21',
      time: '10:00',
      source: 'whatsapp',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      slot_id: 3,
      vendor_id: 1,
      customer_name: 'Ali Khan',
      customer_phone: '+923003333333',
      customer_email: 'ali@example.com',
      service_id: 1,
      date: '2025-10-21',
      time: '14:00',
      source: 'manual',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'app':
        return 'bg-blue-500';
      case 'whatsapp':
        return 'bg-green-500';
      case 'manual':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'app':
        return 'bg-blue-100 text-blue-700';
      case 'whatsapp':
        return 'bg-green-100 text-green-700';
      case 'manual':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredBookings = filterSource === 'all' 
    ? bookings 
    : bookings.filter(b => b.source === filterSource);

  const todayBookings = filteredBookings.filter(
    (b) => b.date === selectedDate.toISOString().split('T')[0]
  );

  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 8; // 8 AM to 9 PM
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="month">Month View</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="app">App Bookings</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="manual">Manual Entry</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft size={18} />
          </Button>
          <span className="font-medium px-4">
            {selectedDate.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" size="sm">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />

            {/* Legend */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium mb-2">Booking Sources:</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-muted-foreground">App</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-muted-foreground">Manual</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedDate.toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardTitle>
              <Badge>{todayBookings.length} bookings</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {timeSlots.map((time) => {
                const booking = todayBookings.find((b) => b.time === time);

                return (
                  <div
                    key={time}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${
                      booking ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <div className="w-20 text-sm font-medium text-muted-foreground">{time}</div>

                    {booking ? (
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-12 rounded-full ${getSourceColor(booking.source)}`} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{booking.customer_name}</p>
                              <Badge className={`text-xs ${getSourceBadgeColor(booking.source)}`}>
                                {booking.source}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{booking.customer_phone}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate('vendor-bookings', { booking })}
                        >
                          View Details
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 text-sm text-muted-foreground">Available</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">App Bookings</p>
                <p className="text-2xl font-bold">
                  {filteredBookings.filter((b) => b.source === 'app').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp Bookings</p>
                <p className="text-2xl font-bold">
                  {filteredBookings.filter((b) => b.source === 'whatsapp').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manual Entries</p>
                <p className="text-2xl font-bold">
                  {filteredBookings.filter((b) => b.source === 'manual').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
