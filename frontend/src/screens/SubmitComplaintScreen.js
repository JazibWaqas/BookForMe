import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { useComplaints } from '../contexts/ComplaintsContext';

const complaintTypes = [
  { id: 'security', name: 'Security Issue', icon: 'shield', color: '#ef4444' },
  { id: 'traffic', name: 'Traffic Problem', icon: 'car', color: '#f59e0b' },
  { id: 'utility', name: 'Utility Issue', icon: 'flash', color: '#eab308' },
  { id: 'noise', name: 'Noise Complaint', icon: 'volume-high', color: '#8b5cf6' },
  { id: 'sanitation', name: 'Sanitation', icon: 'trash', color: '#10b981' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6b7280' },
];

const priorityLevels = [
  { id: 'low', name: 'Low', color: '#10b981' },
  { id: 'medium', name: 'Medium', color: '#f59e0b' },
  { id: 'high', name: 'High', color: '#ef4444' },
  { id: 'urgent', name: 'Urgent', color: '#dc2626' },
];

export default function SubmitComplaintScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { createComplaint, loading, error } = useComplaints();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = getStyles(theme);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to submit a complaint');
      return;
    }

    if (!selectedType) {
      Alert.alert('Error', 'Please select a complaint type');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    setIsSubmitting(true);

    try {
      const complaintData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedType,
        priority: selectedPriority,
        location: location.trim(),
        images: images, // Note: In a real app, you'd upload images to Firebase Storage
        status: 'pending',
      };

      await createComplaint(complaintData);
      
      Alert.alert(
        'Success',
        'Your complaint has been submitted successfully. We will review and take action within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedType(null);
              setSelectedPriority('medium');
              setTitle('');
              setDescription('');
              setLocation('');
              setImages([]);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComplaintType = (type) => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.typeCard,
        selectedType === type.id && styles.typeCardSelected
      ]}
      onPress={() => setSelectedType(type.id)}
    >
      <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
        <Ionicons name={type.icon} size={24} color="white" />
      </View>
      <Text style={[
        styles.typeText,
        selectedType === type.id && styles.typeTextSelected
      ]}>
        {type.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPriorityLevel = (priority) => (
    <TouchableOpacity
      key={priority.id}
      style={[
        styles.priorityButton,
        selectedPriority === priority.id && styles.priorityButtonSelected
      ]}
      onPress={() => setSelectedPriority(priority.id)}
    >
      <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
      <Text style={[
        styles.priorityText,
        selectedPriority === priority.id && styles.priorityTextSelected
      ]}>
        {priority.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report an Issue</Text>
        <Text style={styles.headerSubtitle}>
          Help us keep your neighborhood safe by reporting issues
        </Text>
      </View>

      {/* Complaint Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type of Issue *</Text>
        <View style={styles.typesGrid}>
          {complaintTypes.map(renderComplaintType)}
        </View>
      </View>

      {/* Priority Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority Level</Text>
        <View style={styles.priorityContainer}>
          {priorityLevels.map(renderPriorityLevel)}
        </View>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Title *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Brief description of the issue"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Provide detailed information about the issue..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter the exact location"
          placeholderTextColor="#9ca3af"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Ionicons name="camera" size={20} color="#3b82f6" />
            <Text style={styles.imageButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Ionicons name="images" size={20} color="#3b82f6" />
            <Text style={styles.imageButtonText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>
        
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit Button */}
      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || loading}
        >
          {(isSubmitting || loading) ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="reload" size={20} color="white" style={styles.spinner} />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Complaint</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  typeTextSelected: {
    color: '#3b82f6',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  priorityButtonSelected: {
    backgroundColor: '#dbeafe',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  priorityTextSelected: {
    color: '#3b82f6',
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  submitSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 