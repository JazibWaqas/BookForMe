import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FriendCard from './FriendCard';
import { COLORS } from '../../constants/colors';
import { apiClient, API_ENDPOINTS } from '../../config/api';

interface User {
    id: string;
    name: string;
    avatar_url?: string;
    rank?: number;
    points?: number;
}

interface FriendsTabProps {
    currentUserId: string;
    onChatWithFriend?: (userId: string) => void;
}

export default function FriendsTab({ currentUserId, onChatWithFriend }: FriendsTabProps) {
    const [activeSection, setActiveSection] = useState<'friends' | 'find'>('friends');
    const [friends, setFriends] = useState<User[]>([]);
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
                const res = await apiClient.get(API_ENDPOINTS.social.friends, { params: { user_id: currentUserId } });
                setFriends(res.data.friends || []);
            } else if (activeSection === 'find') {
                const res = await apiClient.get(API_ENDPOINTS.social.users);
                const allUsers = res.data || [];
                // Filter out current user
                setSuggestions(allUsers.filter((u: User) => u.id !== currentUserId));
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
            try {
                const res = await apiClient.get(API_ENDPOINTS.social.users, { params: { search: query } });
                const results = (res.data || []).filter((u: User) => u.id !== currentUserId);
                setSearchResults(results);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleAddFriend = async (userId: string) => {
        try {
            await apiClient.post(API_ENDPOINTS.social.sendFriendRequest, null, { params: { to_user_id: userId } });
            Alert.alert('Friend Added!', 'You are now friends.');
            setSuggestions(prev => prev.filter(u => u.id !== userId));
            setSearchResults(prev => prev.filter(u => u.id !== userId));
            // Refresh friends list
            loadData();
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to add friend';
            Alert.alert('Error', msg);
        }
    };

    const handleRemoveFriend = async (friendId: string, friendName: string) => {
        Alert.alert('Remove Friend?', `Are you sure you want to remove ${friendName}?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Remove', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        await apiClient.post(API_ENDPOINTS.social.removeFriend, null, { params: { friend_id: friendId } });
                        setFriends(prev => prev.filter(f => f.id !== friendId));
                    } catch (error: any) {
                        Alert.alert('Error', 'Failed to remove friend');
                    }
                }
            },
        ]);
    };

    const renderSectionTabs = () => (
        <View style={styles.tabsContainer}>
            {[
                { key: 'friends', label: 'My Friends', icon: 'people' },
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
                                        onRemove={() => handleRemoveFriend(item.id, item.name)}
                                    />
                                ))}
                            </View>
                        ) : renderEmptyState('No friends yet. Start connecting!', 'people-outline')
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
