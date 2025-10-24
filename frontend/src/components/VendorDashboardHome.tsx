import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, Activity, Phone, Globe, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { vendorApi, mockData } from '../services/api';
import type { DashboardMetrics, Booking } from '../types';

interface VendorDashboardHomeProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function VendorDashboardHome({ onNavigate }: VendorDashboardHomeProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    today_bookings: 8,
    pending_bookings: 3,
    total_revenue: 45000,
    active_integrations: 2,
    recent_bookings: mockData.bookings,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch real metrics from API
    // const fetchMetrics = async () => {
    //   setLoading(true);
    //   const data = await vendorApi.dashboard.getMetrics();
    //   setMetrics(data);
    //   setLoading(false);
    // };
    // fetchMetrics();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Today's Bookings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{metrics.today_bookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 dark:text-green-400">+12%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        {/* Pending Bookings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{metrics.pending_bookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        {/* Total Revenue (This Month) */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">PKR {metrics.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 dark:text-green-400">+18%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Active Integrations */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Integrations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{metrics.active_integrations}/2</div>
            <p className="text-xs text-muted-foreground mt-1">Connected channels</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">Recent Bookings</CardTitle>
              <Button variant="outline" size="sm" onClick={() => onNavigate('vendor-bookings')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recent_bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium dark:text-white">{booking.customer_name}</p>
                      <Badge className={`text-xs ${getSourceColor(booking.source)}`}>
                        {booking.source}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.date)} • {booking.time}
                    </p>
                    <p className="text-sm text-muted-foreground">{booking.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getStatusColor(booking.status)} mb-2`}>
                      {booking.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Booked {formatDate(booking.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {metrics.recent_bookings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto mb-2" size={40} />
                  <p>No recent bookings</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Integration Status */}
        <div className="space-y-4 lg:space-y-6">
          {/* Quick Actions */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('vendor-calendar')}
              >
                <Calendar className="mr-2" size={18} />
                View Calendar
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('vendor-bookings')}
              >
                <Clock className="mr-2" size={18} />
                Add Manual Booking
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigate('vendor-profile')}
              >
                <Activity className="mr-2" size={18} />
                Update Business Info
              </Button>
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Integration Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* WhatsApp Status */}
              <div className="flex items-center justify-between p-3 border dark:border-gray-600 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Phone className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm dark:text-white">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Business API</p>
                  </div>
                </div>
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              </div>

              {/* Google Sheets Status */}
              <div className="flex items-center justify-between p-3 border dark:border-gray-600 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Globe className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm dark:text-white">Google Sheets</p>
                    <p className="text-xs text-muted-foreground">Auto-sync enabled</p>
                  </div>
                </div>
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
              </div>

              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => onNavigate('vendor-integrations')}
              >
                Manage Integrations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
