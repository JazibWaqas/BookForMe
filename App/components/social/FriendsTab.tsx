import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FriendCard from './FriendCard';
import { COLORS } from '../../constants/colors';

interface User {
    id: string;
    name: string;
    avatar_url?: string;
    level?: number;
    mutual_friends?: number;
}

interface FriendRequest {
    id: string;
    from_user: User;
    to_user: User;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
}

interface FriendsTabProps {
    currentUserId: string;
    onChatWithFriend?: (userId: string) => void;
}

export default function FriendsTab({ currentUserId, onChatWithFriend }: FriendsTabProps) {
    const [activeSection, setActiveSection] = useState<'friends' | 'requests' | 'find'>('friends');
    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeSection]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeSection === 'friends') {
                // Mock data for now
                setFriends([
                    { id: '1', name: 'Ahmed Khan', level: 5, mutual_friends: 12 },
                    { id: '2', name: 'Sara Ali', level: 3, mutual_friends: 8 },
                    { id: '3', name: 'Omar Hassan', level: 7, mutual_friends: 5 },
                ]);
            } else if (activeSection === 'requests') {
                // Mock data
                setRequests([
                    { id: 'r1', from_user: { id: '4', name: 'Ali Raza', level: 2 }, to_user: { id: currentUserId, name: 'You' }, status: 'pending', created_at: new Date().toISOString() },
                ]);
            } else if (activeSection === 'find') {
                // Mock suggestions
                setSuggestions([
                    { id: '5', name: 'Fatima Zahra', level: 4, mutual_friends: 3 },
                    { id: '6', name: 'Hassan Ali', level: 6, mutual_friends: 7 },
                ]);
            }
        } catch (error) {
            console.error('Error loading friends data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            setSearchResults([
                { id: '7', name: query + ' Player', level: 2 },
            ]);
        } else {
            setSearchResults([]);
        }
    };

    const handleAddFriend = async (userId: string) => {
        try {
            Alert.alert('Friend Request Sent!', 'They will be notified of your request.');
            setSuggestions(prev => prev.filter(u => u.id !== userId));
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send friend request');
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        try {
            Alert.alert('Friend Added!', 'You are now friends.');
            const request = requests.find(r => r.id === requestId);
            if (request) {
                setFriends(prev => [...prev, request.from_user]);
                setRequests(prev => prev.filter(r => r.id !== requestId));
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to accept request');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reject request');
        }
    };

    const renderSectionTabs = () => (
        <View style={styles.tabsContainer}>
            {[
                { key: 'friends', label: 'My Friends', icon: 'people' },
                { key: 'requests', label: 'Requests', icon: 'person-add', badge: requests.length },
                { key: 'find', label: 'Find Friends', icon: 'search' },
            ].map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[styles.tab, activeSection === tab.key && styles.tabActive]}
                    onPress={() => setActiveSection(tab.key as any)}
                >
                    <Ionicons
                        name={tab.icon as any}
                        size={18}
                        color={activeSection === tab.key ? '#fff' : COLORS.textMuted}
                    />
                    <Text style={[styles.tabText, activeSection === tab.key && styles.tabTextActive]}>
                        {tab.label}
                    </Text>
                    {tab.badge !== undefined && tab.badge > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderEmptyState = (message: string, icon: string) => (
        <View style={styles.emptyContainer}>
            <Ionicons name={icon as any} size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>{message}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderSectionTabs()}

            {/* Search (for Find Friends) */}
            {activeSection === 'find' && (
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={COLORS.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
                <View>
                    {/* Friends List - Using View.map instead of FlatList */}
                    {activeSection === 'friends' && (
                        friends.length > 0 ? (
                            <View>
                                {friends.map((item) => (
                                    <FriendCard
                                        key={item.id}
                                        user={item}
                                        status="friends"
                                        onMessage={() => onChatWithFriend?.(item.id)}
                                        onRemove={() => Alert.alert('Remove Friend?', `Are you sure you want to remove ${item.name}?`, [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Remove', style: 'destructive', onPress: () => setFriends(prev => prev.filter(f => f.id !== item.id)) },
                                        ])}
                                    />
                                ))}
                            </View>
                        ) : renderEmptyState('No friends yet. Start connecting!', 'people-outline')
                    )}

                    {/* Friend Requests */}
                    {activeSection === 'requests' && (
                        requests.length > 0 ? (
                            <View>
                                {requests.map((item) => (
                                    <FriendCard
                                        key={item.id}
                                        user={item.from_user}
                                        status="incoming"
                                        onAccept={() => handleAcceptRequest(item.id)}
                                        onReject={() => handleRejectRequest(item.id)}
                                    />
                                ))}
                            </View>
                        ) : renderEmptyState('No pending requests', 'mail-outline')
                    )}

                    {/* Find Friends / Suggestions */}
                    {activeSection === 'find' && (
                        <View>
                            {searchQuery.length >= 2 && searchResults.length > 0 && (
                                <View>
                                    <Text style={styles.sectionTitle}>Search Results</Text>
                                    {searchResults.map(user => (
                                        <FriendCard
                                            key={user.id}
                                            user={user}
                                            status="none"
                                            onAddFriend={() => handleAddFriend(user.id)}
                                        />
                                    ))}
                                </View>
                            )}

                            <Text style={styles.sectionTitle}>Suggested Friends</Text>
                            {suggestions.length > 0 ? (
                                <View>
                                    {suggestions.map((item) => (
                                        <FriendCard
                                            key={item.id}
                                            user={item}
                                            status="none"
                                            onAddFriend={() => handleAddFriend(item.id)}
                                        />
                                    ))}
                                </View>
                            ) : renderEmptyState('No suggestions available', 'sparkles-outline')}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    tabActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    tabBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 18,
        alignItems: 'center',
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingLeft: 10,
        fontSize: 15,
        color: COLORS.text,
    },
    listContent: {
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 12,
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
