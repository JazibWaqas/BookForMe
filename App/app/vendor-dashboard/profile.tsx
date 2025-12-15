import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/categories';

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
    // Load saved profile data from AsyncStorage
    try {
      const savedData = await AsyncStorage.getItem('vendorProfile');
      if (savedData) {
        const data = JSON.parse(savedData);
        setBusinessName(data.businessName || '');
        setOwnerName(data.ownerName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setCnic(data.cnic || '');
        setCategory(data.category || 'padel');
        setAddress(data.address || '');
        setLocation(data.location || null);
        setDescription(data.description || '');
        setProfileImage(data.profileImage || null);
        setBusinessImages(data.businessImages || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfileData = async () => {
    try {
      const data = {
        businessName,
        ownerName,
        email,
        phone,
        cnic,
        category,
        address,
        location,
        description,
        profileImage,
        businessImages,
      };
      await AsyncStorage.setItem('vendorProfile', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving profile:', error);
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
    if (!businessName || !ownerName || !email || !phone || !cnic || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    await saveProfileData();
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Profile updated successfully');
    }, 1000);
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
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vendor Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <Card style={styles.profileImageCard}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>Business Logo</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={() => pickImage('profile')}
            >
              <Text style={styles.imagePickerText}>Change</Text>
            </TouchableOpacity>
          </View>
        </Card>

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
        <Card style={styles.statsCard}>
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
              <Text style={styles.statValue}>PKR 450K</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </Card>

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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileImageCard: {
    marginBottom: 20,
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
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileImageText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  imagePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  imagePickerText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  categoryButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  locationButton: {
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  imageItem: {
    marginRight: 12,
    position: 'relative',
  },
  businessImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  statsCard: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  saveButton: {
    marginBottom: 12,
  },
  signOutButton: {
    marginBottom: 20,
  },
});

