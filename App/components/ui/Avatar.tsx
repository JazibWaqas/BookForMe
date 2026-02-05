import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface AvatarProps {
    uri?: string | null;
    name?: string;
    size?: number;
    style?: any;
}

// Generate initials from a name (e.g., "John Doe" -> "JD")
const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Generate a consistent color based on the name
const getColorFromName = (name: string): string => {
    const colors = [
        '#3B82F6', // Blue
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#EF4444', // Red
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#06B6D4', // Cyan
        '#6366F1', // Indigo
    ];

    if (!name) return colors[0];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

export default function Avatar({ uri, name = '', size = 50, style }: AvatarProps) {
    const initials = getInitials(name);
    const backgroundColor = getColorFromName(name);
    const fontSize = size * 0.4;

    // Check if URI is valid
    const hasValidUri = uri && uri.trim() !== '' && !uri.includes('undefined') && !uri.includes('null');

    if (hasValidUri) {
        return (
            <Image
                source={{ uri }}
                style={[
                    styles.image,
                    { width: size, height: size, borderRadius: size / 2 },
                    style
                ]}
            />
        );
    }

    return (
        <View
            style={[
                styles.initialsContainer,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor
                },
                style
            ]}
        >
            <Text style={[styles.initialsText, { fontSize }]}>
                {initials}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        backgroundColor: COLORS.border,
    },
    initialsContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
