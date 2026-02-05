import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

interface Match {
    id: string;
    sport_type: string;
    match_type: string;
    date: string;
    time: string;
    location: string;
    max_players: number;
    participants?: Array<{ id: string; name: string; avatar_url?: string }>;
    host_user_id?: string;
    description?: string;
}

interface MatchCardProps {
    match: Match;
    onSwipeRight: () => void;
    onSwipeLeft: () => void;
    isFirst: boolean;
}

export default function MatchCard({ match, onSwipeRight, onSwipeLeft, isFirst }: MatchCardProps) {
    const position = useRef(new Animated.ValueXY()).current;
    const [likeOpacity] = useState(new Animated.Value(0));
    const [nopeOpacity] = useState(new Animated.Value(0));

    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-10deg', '0deg', '10deg'],
        extrapolate: 'clamp',
    });

    const rotateAndTranslate = {
        transform: [
            { rotate },
            ...position.getTranslateTransform(),
        ],
    };

    const likeScale = position.x.interpolate({
        inputRange: [0, SCREEN_WIDTH / 4],
        outputRange: [0.5, 1],
        extrapolate: 'clamp',
    });

    const nopeScale = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 4, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isFirst,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
                // Update overlay opacity
                if (gesture.dx > 0) {
                    likeOpacity.setValue(Math.min(gesture.dx / (SCREEN_WIDTH / 4), 1));
                    nopeOpacity.setValue(0);
                } else {
                    nopeOpacity.setValue(Math.min(-gesture.dx / (SCREEN_WIDTH / 4), 1));
                    likeOpacity.setValue(0);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    // Swiped right - Join match
                    Animated.timing(position, {
                        toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
                        duration: SWIPE_OUT_DURATION,
                        useNativeDriver: false,
                    }).start(() => onSwipeRight());
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    // Swiped left - Skip
                    Animated.timing(position, {
                        toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
                        duration: SWIPE_OUT_DURATION,
                        useNativeDriver: false,
                    }).start(() => onSwipeLeft());
                } else {
                    // Return to center
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        friction: 4,
                        useNativeDriver: false,
                    }).start();
                    likeOpacity.setValue(0);
                    nopeOpacity.setValue(0);
                }
            },
        })
    ).current;

    const getSportIcon = (sport: string) => {
        const icons: Record<string, string> = {
            'Padel': '🎾',
            'Tennis': '🎾',
            'Football': '⚽',
            'Basketball': '🏀',
            'Volleyball': '🏐',
            'Badminton': '🏸',
        };
        return icons[sport] || '🏃';
    };

    const currentPlayers = match.participants?.length || 1;

    return (
        <Animated.View
            {...(isFirst ? panResponder.panHandlers : {})}
            style={[styles.card, isFirst ? rotateAndTranslate : { transform: [{ scale: 0.95 }] }]}
        >
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                style={styles.cardGradient}
            >
                {/* Join Indicator */}
                <Animated.View style={[styles.joinOverlay, { opacity: likeOpacity, transform: [{ scale: likeScale }] }]}>
                    <View style={styles.joinBadge}>
                        <Text style={styles.joinText}>JOIN</Text>
                        <Ionicons name="checkmark-circle" size={32} color="#4ADE80" />
                    </View>
                </Animated.View>

                {/* Skip Indicator */}
                <Animated.View style={[styles.skipOverlay, { opacity: nopeOpacity, transform: [{ scale: nopeScale }] }]}>
                    <View style={styles.skipBadge}>
                        <Text style={styles.skipText}>SKIP</Text>
                        <Ionicons name="close-circle" size={32} color="#EF4444" />
                    </View>
                </Animated.View>

                {/* Sport Icon */}
                <View style={styles.sportIconContainer}>
                    <Text style={styles.sportIcon}>{getSportIcon(match.sport_type)}</Text>
                </View>

                {/* Sport Name */}
                <Text style={styles.sportName}>{match.sport_type}</Text>

                {/* Match Type Badge */}
                <View style={[styles.typeBadge, match.match_type === 'ranked' && styles.typeBadgeRanked]}>
                    <Text style={styles.typeText}>
                        {match.match_type === 'ranked' ? '🏆 RANKED' : '⚡ CASUAL'}
                    </Text>
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>{match.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>{match.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
                        <Text style={styles.detailText} numberOfLines={1}>{match.location || 'TBD'}</Text>
                    </View>
                </View>

                {/* Players */}
                <View style={styles.playersSection}>
                    <Text style={styles.playersLabel}>PLAYERS</Text>
                    <View style={styles.playersRow}>
                        {match.participants?.slice(0, 4).map((p, i) => (
                            <Image
                                key={p.id}
                                source={{ uri: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random` }}
                                style={[styles.playerAvatar, { marginLeft: i > 0 ? -10 : 0 }]}
                            />
                        ))}
                        <View style={styles.playerCountBadge}>
                            <Text style={styles.playerCountText}>
                                {currentPlayers}/{match.max_players}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description */}
                {match.description && (
                    <Text style={styles.description} numberOfLines={2}>
                        "{match.description}"
                    </Text>
                )}

                {/* Swipe Hint */}
                <View style={styles.swipeHint}>
                    <Text style={styles.swipeHintText}>← Skip | Join →</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        width: SCREEN_WIDTH - 40,
        height: 450,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    cardGradient: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    joinOverlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1000,
    },
    joinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#4ADE80',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
    },
    joinText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4ADE80',
        marginRight: 8,
    },
    skipOverlay: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1000,
    },
    skipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#EF4444',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    skipText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EF4444',
        marginRight: 8,
    },
    sportIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 12,
    },
    sportIcon: {
        fontSize: 40,
    },
    sportName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    typeBadge: {
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.secondary + '40',
        marginBottom: 16,
    },
    typeBadgeRanked: {
        backgroundColor: '#FFD700' + '40',
    },
    typeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    detailsContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    playersSection: {
        alignItems: 'center',
        marginBottom: 12,
    },
    playersLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.textMuted,
        marginBottom: 8,
        letterSpacing: 1,
    },
    playersRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    playerCountBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    playerCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    description: {
        fontStyle: 'italic',
        color: COLORS.textMuted,
        textAlign: 'center',
        fontSize: 13,
    },
    swipeHint: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    swipeHintText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
});
