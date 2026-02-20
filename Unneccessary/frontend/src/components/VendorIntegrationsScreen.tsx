import { useState, useEffect } from 'react';
import { Phone, Globe, CheckCircle, XCircle, AlertCircle, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { vendorApi } from '../services/api';
import type { VendorIntegrationStatus } from '../types';

interface VendorIntegrationsScreenProps {
  onNavigate: (screen: string) => void;
}

export function VendorIntegrationsScreen({ onNavigate }: VendorIntegrationsScreenProps) {
  const [integrationStatus, setIntegrationStatus] = useState<VendorIntegrationStatus>({
    whatsapp: {
      connected: true,
      phone_number: '+92 300 1234567',
      last_verified: new Date().toISOString(),
    },
    google_sheets: {
      connected: true,
      sheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheet_name: 'Bookings Master',
      last_sync: new Date().toISOString(),
    },
  });

  const [whatsappForm, setWhatsappForm] = useState({
    phone_number: '',
    access_token: '',
    webhook_verify_token: '',
  });

  const [sheetsForm, setSheetsForm] = useState({
    sheet_id: '',
    date_column: 'A',
    time_column: 'B',
    customer_column: 'C',
    service_column: 'D',
  });

  const [loading, setLoading] = useState({ whatsapp: false, sheets: false, test: false });

  useEffect(() => {
    // TODO: Fetch integration status from API
    // const fetchStatus = async () => {
    //   const status = await vendorApi.integrations.getStatus();
    //   setIntegrationStatus(status);
    // };
    // fetchStatus();
  }, []);

  const handleWhatsAppConnect = async () => {
    setLoading({ ...loading, whatsapp: true });
    try {
      // TODO: Replace with actual API call
      // await vendorApi.integrations.connectWhatsApp(whatsappForm);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setIntegrationStatus({
        ...integrationStatus,
        whatsapp: {
          connected: true,
          phone_number: whatsappForm.phone_number,
          last_verified: new Date().toISOString(),
        },
      });
      alert('WhatsApp connected successfully!');
    } catch (error) {
      alert('Failed to connect WhatsApp. Please check your credentials.');
    } finally {
      setLoading({ ...loading, whatsapp: false });
    }
  };

  const handleWhatsAppTest = async () => {
    setLoading({ ...loading, test: true });
    try {
      // TODO: Replace with actual API call
      // await vendorApi.integrations.testWhatsApp();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Test message sent successfully! Check your WhatsApp.');
    } catch (error) {
      alert('Test failed. Please check your connection.');
    } finally {
      setLoading({ ...loading, test: false });
    }
  };

  const handleWhatsAppDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp? You will stop receiving automated booking messages.')) {
      return;
    }
    
    try {
      // TODO: Replace with actual API call
      // await vendorApi.integrations.disconnectWhatsApp();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setIntegrationStatus({
        ...integrationStatus,
        whatsapp: { connected: false },
      });
    } catch (error) {
      alert('Failed to disconnect WhatsApp.');
    }
  };

  const handleSheetsConnect = async () => {
    setLoading({ ...loading, sheets: true });
    try {
      // In real implementation, this would trigger OAuth flow
      // For now, simulate the connection
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setIntegrationStatus({
        ...integrationStatus,
        google_sheets: {
          connected: true,
          sheet_id: sheetsForm.sheet_id,
          sheet_name: 'Bookings Master',
          last_sync: new Date().toISOString(),
        },
      });
      alert('Google Sheets connected successfully!');
    } catch (error) {
      alert('Failed to connect Google Sheets.');
    } finally {
      setLoading({ ...loading, sheets: false });
    }
  };

  const handleSheetsDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Sheets? Manual entries will no longer sync.')) {
      return;
    }
    
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setIntegrationStatus({
        ...integrationStatus,
        google_sheets: { connected: false },
      });
    } catch (error) {
      alert('Failed to disconnect Google Sheets.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Status Card */}
        <Card className={integrationStatus.whatsapp.connected ? 'border-green-200' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="text-green-600" size={24} />
                </div>
                <div>
                  <CardTitle>WhatsApp Business</CardTitle>
                  <CardDescription>Handle bookings via WhatsApp</CardDescription>
                </div>
              </div>
              {integrationStatus.whatsapp.connected ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="mr-1" size={14} />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <XCircle className="mr-1" size={14} />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {integrationStatus.whatsapp.connected ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Connected Number</p>
                  <p className="font-medium">{integrationStatus.whatsapp.phone_number}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Last Verified</p>
                  <p className="text-sm">
                    {new Date(integrationStatus.whatsapp.last_verified!).toLocaleString('en-PK')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleWhatsAppTest}
                    disabled={loading.test}
                  >
                    {loading.test ? 'Testing...' : 'Send Test Message'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={handleWhatsAppDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="w-full" onClick={() => {}}>
                <LinkIcon className="mr-2" size={18} />
                Connect WhatsApp
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Google Sheets Status Card */}
        <Card className={integrationStatus.google_sheets.connected ? 'border-blue-200' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="text-blue-600" size={24} />
                </div>
                <div>
                  <CardTitle>Google Sheets</CardTitle>
                  <CardDescription>Sync manual bookings automatically</CardDescription>
                </div>
              </div>
              {integrationStatus.google_sheets.connected ? (
                <Badge className="bg-blue-100 text-blue-700">
                  <CheckCircle className="mr-1" size={14} />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <XCircle className="mr-1" size={14} />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {integrationStatus.google_sheets.connected ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Connected Sheet</p>
                  <p className="font-medium truncate">{integrationStatus.google_sheets.sheet_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {integrationStatus.google_sheets.sheet_id?.substring(0, 20)}...
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Last Sync</p>
                  <p className="text-sm flex items-center gap-2">
                    <RefreshCw size={14} />
                    {new Date(integrationStatus.google_sheets.last_sync!).toLocaleString('en-PK')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700"
                  onClick={handleSheetsDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={() => {}}>
                <LinkIcon className="mr-2" size={18} />
                Connect Google Sheets
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whatsapp">WhatsApp Setup</TabsTrigger>
          <TabsTrigger value="sheets">Google Sheets Setup</TabsTrigger>
        </TabsList>

        {/* WhatsApp Setup */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API Setup</CardTitle>
              <CardDescription>
                Connect your WhatsApp Business account to let the AI handle booking messages automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You'll need a Meta WhatsApp Business API account. For testing, you can use Meta's test number.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-phone">WhatsApp Business Phone Number</Label>
                  <Input
                    id="whatsapp-phone"
                    placeholder="+92 300 1234567"
                    value={whatsappForm.phone_number}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, phone_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input
                    id="access-token"
                    type="password"
                    placeholder="Your Meta API access token"
                    value={whatsappForm.access_token}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, access_token: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verify-token">Webhook Verify Token</Label>
                  <Input
                    id="verify-token"
                    type="password"
                    placeholder="Custom verify token for webhook"
                    value={whatsappForm.webhook_verify_token}
                    onChange={(e) =>
                      setWhatsappForm({ ...whatsappForm, webhook_verify_token: e.target.value })
                    }
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Webhook URL (Copy this to Meta Developer Console)</p>
                  <code className="text-sm bg-background px-3 py-2 rounded block">
                    https://api.bookforme.com/api/webhooks/whatsapp
                  </code>
                </div>

                <Button
                  className="w-full"
                  onClick={handleWhatsAppConnect}
                  disabled={loading.whatsapp || !whatsappForm.phone_number || !whatsappForm.access_token}
                >
                  {loading.whatsapp ? 'Connecting...' : 'Connect WhatsApp'}
                </Button>
              </div>

              {/* Setup Steps */}
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Setup Steps:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Create a Meta Developer account at developers.facebook.com</li>
                  <li>Create a new app and add WhatsApp Business product</li>
                  <li>Get your test number or connect your business number</li>
                  <li>Generate an access token from the dashboard</li>
                  <li>Set up webhook with the URL provided above</li>
                  <li>Enter your credentials above and click Connect</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Sheets Setup */}
        <TabsContent value="sheets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Sheets Integration Setup</CardTitle>
              <CardDescription>
                Sync manual bookings from your Google Sheet automatically every 5 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure your Google Sheet is properly formatted with columns for Date, Time, Customer Name, and
                  Service.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sheet-id">Google Sheet ID</Label>
                  <Input
                    id="sheet-id"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={sheetsForm.sheet_id}
                    onChange={(e) => setSheetsForm({ ...sheetsForm, sheet_id: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in your Google Sheets URL after /d/
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-col">Date Column</Label>
                    <Input
                      id="date-col"
                      placeholder="A"
                      value={sheetsForm.date_column}
                      onChange={(e) => setSheetsForm({ ...sheetsForm, date_column: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-col">Time Column</Label>
                    <Input
                      id="time-col"
                      placeholder="B"
                      value={sheetsForm.time_column}
                      onChange={(e) => setSheetsForm({ ...sheetsForm, time_column: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-col">Customer Name Column</Label>
                    <Input
                      id="customer-col"
                      placeholder="C"
                      value={sheetsForm.customer_column}
                      onChange={(e) => setSheetsForm({ ...sheetsForm, customer_column: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-col">Service Column</Label>
                    <Input
                      id="service-col"
                      placeholder="D"
                      value={sheetsForm.service_column}
                      onChange={(e) => setSheetsForm({ ...sheetsForm, service_column: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSheetsConnect}
                  disabled={loading.sheets || !sheetsForm.sheet_id}
                >
                  {loading.sheets ? 'Connecting...' : 'Authorize & Connect Google Sheets'}
                </Button>
              </div>

              {/* Setup Steps */}
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Setup Steps:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Create a Google Sheet with your booking data</li>
                  <li>Format columns: Date (YYYY-MM-DD), Time (HH:MM), Customer Name, Service</li>
                  <li>Copy the Sheet ID from the URL</li>
                  <li>Map your columns using the form above</li>
                  <li>Click Authorize to grant access via OAuth</li>
                  <li>Bookings will sync automatically every 5 minutes</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
