import { useState } from 'react';
import { Search, Filter, Download, Plus, Edit, Trash2, Calendar, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { mockData } from '../services/api';
import type { Booking } from '../types';

interface VendorBookingsScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function VendorBookingsScreen({ onNavigate }: VendorBookingsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mock bookings - replace with API call
  const [bookings, setBookings] = useState<Booking[]>([
    ...mockData.bookings,
    {
      id: 2,
      slot_id: 2,
      vendor_id: 1,
      customer_name: 'Sara Ahmed',
      customer_phone: '+92 300 2222222',
      customer_email: 'sara@example.com',
      service_id: 1,
      date: '2025-10-22',
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
      customer_phone: '+92 300 3333333',
      customer_email: 'ali@example.com',
      service_id: 1,
      date: '2025-10-23',
      time: '14:00',
      source: 'manual',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [newBooking, setNewBooking] = useState({
    customer_name: '',
    customer_phone: '',
    date: '',
    time: '',
    service: '',
  });

  const getSourceColor = (source: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer_phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || booking.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleAddBooking = async () => {
    // TODO: Call API to create booking
    const booking: Booking = {
      id: Math.floor(Math.random() * 10000),
      slot_id: Math.floor(Math.random() * 10000),
      vendor_id: 1,
      customer_name: newBooking.customer_name,
      customer_phone: newBooking.customer_phone,
      customer_email: '',
      service_id: 1,
      date: newBooking.date,
      time: newBooking.time,
      source: 'manual',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBookings([...bookings, booking]);
    setIsAddDialogOpen(false);
    setNewBooking({ customer_name: '', customer_phone: '', date: '', time: '', service: '' });
  };

  const handleDeleteBooking = async (id: number) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    // TODO: Call API to delete booking
    setBookings(bookings.filter((b) => b.id !== id));
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    alert('CSV export will be implemented with backend integration');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by name or phone..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="app">App</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2" size={18} />
            Export CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" size={18} />
                Add Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] mx-auto">
              <DialogHeader>
                <DialogTitle>Add Manual Booking</DialogTitle>
                <DialogDescription>Create a new booking manually for your customer.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name</Label>
                  <Input
                    id="name"
                    value={newBooking.customer_name}
                    onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newBooking.customer_phone}
                    onChange={(e) => setNewBooking({ ...newBooking, customer_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select value={newBooking.service} onValueChange={(value) => setNewBooking({ ...newBooking, service: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="futsal">Futsal Court</SelectItem>
                      <SelectItem value="badminton">Badminton Court</SelectItem>
                      <SelectItem value="swimming">Swimming Pool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBooking}>Add Booking</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono">#{booking.id.toString().padStart(6, '0')}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone size={12} />
                        {booking.customer_phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground" />
                      <div>
                        <p className="font-medium">{new Date(booking.date).toLocaleDateString('en-PK')}</p>
                        <p className="text-sm text-muted-foreground">{booking.time}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSourceColor(booking.source)}>{booking.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(booking.created_at).toLocaleDateString('en-PK')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteBooking(booking.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No bookings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
