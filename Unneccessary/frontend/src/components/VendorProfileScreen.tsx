import { useState } from 'react';
import { Building, MapPin, Phone, Mail, Clock, Upload, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

interface VendorProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export function VendorProfileScreen({ onNavigate }: VendorProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    business_name: 'Arena Sports Complex',
    category: 'Futsal',
    location: 'Clifton, Karachi',
    address: 'Block 5, Clifton, Karachi, Pakistan',
    phone: '+92 300 1234567',
    email: 'arena@example.com',
    description: 'Premium sports complex with state-of-the-art facilities',
  });

  const [operatingHours, setOperatingHours] = useState({
    monday: { open: '08:00', close: '22:00', enabled: true },
    tuesday: { open: '08:00', close: '22:00', enabled: true },
    wednesday: { open: '08:00', close: '22:00', enabled: true },
    thursday: { open: '08:00', close: '22:00', enabled: true },
    friday: { open: '08:00', close: '22:00', enabled: true },
    saturday: { open: '08:00', close: '22:00', enabled: true },
    sunday: { open: '10:00', close: '20:00', enabled: true },
  });

  const [services, setServices] = useState([
    { id: 1, name: 'Futsal Court', duration: 60, price: 2500, description: 'Full-size futsal court' },
    { id: 2, name: 'Badminton Court', duration: 60, price: 1500, description: 'Professional badminton court' },
  ]);

  const handleSaveBusinessInfo = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
      toast.success('Business information updated successfully!');
    } catch (error) {
      toast.error('Failed to update business information');
    }
  };

  const handleSaveOperatingHours = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Operating hours updated successfully!');
    } catch (error) {
      toast.error('Failed to update operating hours');
    }
  };

  const handleSaveServices = async () => {
    // TODO: Call API to update services
    toast('Services updated successfully!');
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business" className="text-xs sm:text-sm">Business Info</TabsTrigger>
          <TabsTrigger value="hours" className="text-xs sm:text-sm">Operating Hours</TabsTrigger>
          <TabsTrigger value="services" className="text-xs sm:text-sm">Services & Pricing</TabsTrigger>
        </TabsList>

        {/* Business Information */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Update your business details and contact information</CardDescription>
              </div>
              <Button 
                variant={isEditing ? "outline" : "default"}
                onClick={() => setIsEditing(!isEditing)}
                className="transition-all duration-200 hover:scale-105"
              >
                {isEditing ? (
                  <>
                    <X className="mr-2" size={18} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Building className="mr-2" size={18} />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <Input
                      id="business-name"
                      className="pl-10"
                      value={businessInfo.business_name}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, business_name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={businessInfo.category} 
                    onValueChange={(value) => setBusinessInfo({ ...businessInfo, category: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Futsal">Futsal</SelectItem>
                      <SelectItem value="Salon">Salon</SelectItem>
                      <SelectItem value="Gaming">Gaming Zone</SelectItem>
                      <SelectItem value="Cinema">Cinema</SelectItem>
                      <SelectItem value="Beach">Beach Hut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <Input
                      id="location"
                      className="pl-10"
                      value={businessInfo.location}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, location: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={businessInfo.description}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <Button onClick={handleSaveBusinessInfo} className="w-full md:w-auto">
                  <Save className="mr-2" size={18} />
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Business Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Business Photos</CardTitle>
              <CardDescription>Upload photos of your venue (max 5 photos)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 text-muted-foreground" size={24} />
                    <p className="text-sm text-muted-foreground">Upload Photo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Set your business hours for each day of the week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(operatingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32">
                    <p className="font-medium capitalize">{day}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Clock size={18} className="text-muted-foreground" />
                    <Input
                      type="time"
                      className="w-32"
                      value={hours.open}
                      onChange={(e) =>
                        setOperatingHours({
                          ...operatingHours,
                          [day]: { ...hours, open: e.target.value },
                        })
                      }
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      className="w-32"
                      value={hours.close}
                      onChange={(e) =>
                        setOperatingHours({
                          ...operatingHours,
                          [day]: { ...hours, close: e.target.value },
                        })
                      }
                    />
                  </div>
                  <Button
                    variant={hours.enabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setOperatingHours({
                        ...operatingHours,
                        [day]: { ...hours, enabled: !hours.enabled },
                      })
                    }
                  >
                    {hours.enabled ? 'Open' : 'Closed'}
                  </Button>
                </div>
              ))}

              <Button onClick={handleSaveOperatingHours}>
                <Save className="mr-2" size={18} />
                Save Operating Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services & Pricing */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Services & Pricing</CardTitle>
                  <CardDescription>Manage your services, pricing, and duration</CardDescription>
                </div>
                <Button>Add New Service</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Service Name</Label>
                          <Input value={service.name} />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input type="number" value={service.duration} />
                        </div>
                        <div className="space-y-2">
                          <Label>Price (PKR)</Label>
                          <Input type="number" value={service.price} />
                        </div>
                        <div className="space-y-2 flex items-end">
                          <Button variant="outline" className="w-full">
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>Description</Label>
                        <Textarea rows={2} value={service.description} className="mt-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button onClick={handleSaveServices} className="mt-4">
                <Save className="mr-2" size={18} />
                Save Services
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
