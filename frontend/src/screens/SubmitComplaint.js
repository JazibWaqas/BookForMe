import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeProvider';
import Header from '../components/Header';

export default function SubmitComplaint() {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUrgent, setIsUrgent] = useState(false);

  const complaintTypes = [
    { id: 'theft', label: 'Theft/Robbery', icon: 'warning', color: '#EF4444' },
    { id: 'harassment', label: 'Harassment', icon: 'person', color: '#F59E0B' },
    { id: 'traffic', label: 'Traffic Issues', icon: 'car', color: '#3B82F6' },
    { id: 'noise', label: 'Noise Complaint', icon: 'volume-high', color: '#8B5CF6' },
    { id: 'utility', label: 'Utility Issues', icon: 'flash', color: '#10B981' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
  ];

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setAttachments([...attachments, result.uri]);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant location access');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const address = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (address.length > 0) {
      const addr = address[0];
      setLocation(`${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}`);
    }
  };

  const handleSubmit = () => {
    if (!selectedType || !description || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Complaint Submitted',
      'Your complaint has been submitted successfully. We will review it and take appropriate action.',
      [
        {
          text: 'OK',
          onPress: () => {
            setSelectedType('');
            setDescription('');
            setLocation('');
            setAttachments([]);
            setIsUrgent(false);
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
    },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      width: 40,
      height: 40,
      backgroundColor: '#FEF3C7',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    complaintTypesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    complaintTypeCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
    },
    complaintTypeCardActive: {
      borderColor: colors.primary,
      backgroundColor: '#EBF8FF',
    },
    complaintTypeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    complaintTypeLabel: {
      fontSize: fontSize.sm,
      color: colors.text,
      textAlign: 'center',
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      fontSize: fontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 40,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    locationRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    locationInput: {
      flex: 1,
    },
    locationButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    urgentToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    urgentToggleActive: {
      backgroundColor: '#FEE2E2',
      borderColor: '#EF4444',
    },
    urgentText: {
      fontSize: fontSize.md,
      color: colors.text,
    },
    urgentTextActive: {
      color: '#EF4444',
      fontWeight: '600',
    },
    attachmentSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    attachmentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    attachmentButtonText: {
      fontSize: fontSize.sm,
      color: colors.text,
      marginLeft: spacing.xs,
    },
    attachmentCount: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '500',
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    submitButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: 'white',
    },
    warningCard: {
      backgroundColor: '#FEF3C7',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    warningText: {
      fontSize: fontSize.sm,
      color: '#92400E',
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Report Issue" />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="document-text" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Submit Complaint</Text>
              <Text style={styles.headerSubtitle}>Report safety concerns or incidents</Text>
            </View>
          </View>
        </View>

        {/* Emergency Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            For immediate emergencies, please call 15 (Police) or 1122 (Rescue)
          </Text>
        </View>

        {/* Complaint Type */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Type of Complaint *</Text>
          <View style={styles.complaintTypesGrid}>
            {complaintTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.complaintTypeCard,
                  selectedType === type.id && styles.complaintTypeCardActive,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <View style={[styles.complaintTypeIcon, { backgroundColor: `${type.color}20` }]}>
                  <Ionicons name={type.icon} size={20} color={type.color} />
                </View>
                <Text style={styles.complaintTypeLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please provide details about the incident..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Location */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location *</Text>
          <View style={styles.locationRow}>
            <TextInput
              style={[styles.input, styles.locationInput]}
              placeholder="Enter location or address"
              placeholderTextColor={colors.textMuted}
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
              <Ionicons name="location" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Urgent Toggle */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={[styles.urgentToggle, isUrgent && styles.urgentToggleActive]}
            onPress={() => setIsUrgent(!isUrgent)}
          >
            <Text style={[styles.urgentText, isUrgent && styles.urgentTextActive]}>
              Mark as Urgent
            </Text>
            <Ionicons
              name={isUrgent ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isUrgent ? '#EF4444' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Attachments */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          <View style={styles.attachmentSection}>
            <TouchableOpacity style={styles.attachmentButton} onPress={handleImagePicker}>
              <Ionicons name="camera" size={20} color={colors.text} />
              <Text style={styles.attachmentButtonText}>Add Photo</Text>
            </TouchableOpacity>
            {attachments.length > 0 && (
              <Text style={styles.attachmentCount}>
                {attachments.length} photo{attachments.length > 1 ? 's' : ''} added
              </Text>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Complaint</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}