import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import Button from './ui/Button';
import { authService } from '../services/auth';
import { showError, showSuccess } from '../utils/feedback';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentUser: {
        name: string;
        phone: string;
        email: string;
    } | null;
}

export default function EditProfileModal({ visible, onClose, onSuccess, currentUser }: EditProfileModalProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || '');
            setPhone(currentUser.phone || '');
        }
    }, [currentUser, visible]);

    const handleSave = async () => {
        if (!name.trim()) {
            showError('Name required', 'Please enter your name.');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.updateProfile({
                name: name.trim(),
                phone: phone.trim()
            });

            if (response.success) {
                showSuccess('Profile updated', 'Your changes were saved.');
                onSuccess();
                onClose();
            } else {
                showError('Could not update profile', response.error || 'Please try again.');
            }
        } catch (error) {
            console.error(error);
            showError('Could not update profile', 'Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit Profile</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter phone number"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={currentUser?.email}
                                editable={false}
                                selectTextOnFocus={false}
                            />
                            <Text style={styles.helperText}>Email cannot be changed</Text>
                        </View>

                        <View style={styles.actions}>
                            <Button
                                title="Cancel"
                                variant="outline"
                                onPress={onClose}
                                style={styles.actionButton}
                            />
                            <Button
                                title={loading ? "Saving..." : "Save Changes"}
                                variant="primary"
                                onPress={handleSave}
                                disabled={loading}
                                style={styles.actionButton}
                            />
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        minHeight: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    closeButton: {
        padding: 4,
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    disabledInput: {
        backgroundColor: COLORS.backgroundLight,
        color: COLORS.textMuted,
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    actionButton: {
        flex: 1,
    },
});
