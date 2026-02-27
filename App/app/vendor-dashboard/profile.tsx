import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';
import { authService } from '../../services/auth';
import { apiClient, API_ENDPOINTS } from '../../config/api';

export default function VendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('Golden Court Padel Club');
  const [ownerName, setOwnerName] = useState('Ahmed Khan');
  const [email, setEmail] = useState('ahmed@goldencourt.com');
  const [phone, setPhone] = useState('+92 300 1234567');
  const [cnic, setCnic] = useState('42101-1234567-1');
  const [category, setCategory] = useState('padel');
  const [address, setAddress] = useState('DHA Phase 5, Lahore');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [description, setDescription] = useState('Premium padel courts with world-class facilities');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [businessImages, setBusinessImages] = useState<string[]>([]);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user || !user.vendor_id) return;

      const res = await apiClient.get(API_ENDPOINTS.vendors.get(user.vendor_id));
      if (res.data.success && res.data.vendor) {
        const vendor = res.data.vendor;
        setBusinessName(vendor.name || vendor.business_name || '');
        setOwnerName(vendor.owner_name || '');
        setEmail(vendor.email || '');
        setPhone(vendor.phone || '');
        setAddress(vendor.address || '');
        setDescription(vendor.description || '');
      }

      // Also grab async storage stuff (like local photos which dont sync yet)
      const savedData = await AsyncStorage.getItem('vendorProfile');
      if (savedData) {
        const data = JSON.parse(savedData);
        setCnic(data.cnic || '');
        setCategory(data.category || 'padel');
        setLocation(data.location || null);
        setProfileImage(data.profileImage || null);
        setBusinessImages(data.businessImages || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfileData = async () => {
    try {
      const user = await authService.getCurrentUser();
      // Sync strictly business data
      if (user && user.vendor_id) {
        await apiClient.patch(API_ENDPOINTS.vendors.patch(user.vendor_id), {
          name: businessName,
          phone: phone,
          email: email,
          address: address,
          description: description,
        });
      }

      const data = {
        cnic,
        category,
        location,
        profileImage,
        businessImages,
      };
      await AsyncStorage.setItem('vendorProfile', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error; // Re-throw so alert handles it
    }
  };

  const pickImage = async (type: 'profile' | 'business') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'profile') {
        setProfileImage(result.assets[0].uri);
      } else {
        setBusinessImages([...businessImages, result.assets[0].uri]);
      }
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const newLocation = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      setLocation(newLocation);

      // Reverse geocode to get address
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (addressResult) {
        const formattedAddress = `${addressResult.street || ''} ${addressResult.city || ''} ${addressResult.region || ''}`.trim();
        if (formattedAddress) {
          setAddress(formattedAddress);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!businessName || !email || !phone || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await saveProfileData();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes to the database');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userRole');
            await AsyncStorage.removeItem('vendorProfile');
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Vendor Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={[styles.premiumCard, styles.profileImageCard]}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                <Text style={styles.profileImageText}>Business Logo</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={() => pickImage('profile')}
            >
              <Text style={styles.imagePickerText}>Change Identity</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          <Input
            label="Business Name *"
            placeholder="Enter business name"
            value={businessName}
            onChangeText={setBusinessName}
            style={styles.input}
          />
          <Input
            label="Owner Name *"
            placeholder="Enter owner name"
            value={ownerName}
            onChangeText={setOwnerName}
            style={styles.input}
          />
          <Input
            label="CNIC *"
            placeholder="42101-1234567-1"
            value={cnic}
            onChangeText={setCnic}
            keyboardType="numeric"
            style={styles.input}
          />
          <View style={styles.categoryContainer}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.id && styles.categoryTextActive,
                    ]}
                  >
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Input
            label="Email *"
            placeholder="business@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
          <Input
            label="Phone Number *"
            placeholder="+92 300 1234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Input
            label="Address *"
            placeholder="Enter business address"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            multiline
          />
          <Button
            title={location ? "Update Location" : "Get Current Location"}
            onPress={getCurrentLocation}
            variant="outline"
            loading={loading}
            style={styles.locationButton}
          />
          {location && (
            <Text style={styles.locationText}>
              Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Input
            label="Business Description"
            placeholder="Describe your business..."
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Business Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            {businessImages.map((uri, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri }} style={styles.businessImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setBusinessImages(businessImages.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={() => pickImage('business')}
            >
              <Text style={styles.addImageText}>+ Add Image</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Stats */}
        <View style={styles.premiumCard}>
          <Text style={styles.statsTitle}>Account Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#00EA77' }]}>PKR 450K</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#0F172A',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  premiumCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileImageCard: {
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileImageText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 234, 119, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 234, 119, 0.2)',
    borderRadius: 12,
  },
  imagePickerText: {
    color: '#00EA77',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  input: {
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  categoryButtonActive: {
    borderColor: '#00EA77',
    backgroundColor: 'rgba(0, 234, 119, 0.05)',
  },
  categoryText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#00EA77',
    fontWeight: '800',
  },
  locationButton: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  imageItem: {
    marginRight: 16,
    position: 'relative',
  },
  businessImage: {
    width: 140,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 140,
    height: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveButton: {
    marginBottom: 12,
  },
  signOutButton: {
    marginBottom: 20,
  },
});

