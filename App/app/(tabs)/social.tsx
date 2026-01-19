import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';
import { API_BASE_URL, getMediaUrl } from '../../config/api';
import { SocialService, Post, Match, UserProfileSocial } from '../../services/social';
import { authService, UserData } from '../../services/auth';

export default function SocialScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'forum' | 'matches' | 'chats' | 'leaderboard'>('forum');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  // Data States
  const [posts, setPosts] = useState<Post[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfileSocial[]>([]);

  // Input States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Post Creation States
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [sendingPost, setSendingPost] = useState(false);

  // Match Creation States
  const [isMatchModalVisible, setIsMatchModalVisible] = useState(false);
  const [newMatchData, setNewMatchData] = useState({ sport: 'Padel', date: '', time: '', location: '', maxPlayers: '4', type: 'casual' });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedFilter]);

  const loadUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'forum') {
        const feed = await SocialService.getFeed(20, 'all', false);
        // Client side search for posts for now
        const filteredFeed = searchQuery
          ? feed.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()))
          : feed;
        setPosts(filteredFeed);
      } else if (activeTab === 'matches') {
        const sportFilter = selectedFilter === 'All' ? 'all' : selectedFilter;
        const matchList = await SocialService.getMatches(sportFilter, searchQuery);
        setMatches(matchList);
      } else if (activeTab === 'chats') {
        if (!currentUser) {
          setLoading(false);
          return;
        }
        const chatList = await SocialService.getConversations(currentUser.id!);
        const filteredChats = searchQuery
          ? chatList.filter((c: any) => c.last_message?.toLowerCase().includes(searchQuery.toLowerCase()))
          : chatList;
        setChats(filteredChats);
      } else if (activeTab === 'leaderboard') {
        const leaders = await SocialService.getLeaderboard();
        setLeaderboard(leaders);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && !newPostImage) || !currentUser) return;

    setSendingPost(true);
    try {
      let imageUrl = null;
      if (newPostImage) {
        const uploadRes = await SocialService.uploadFile(newPostImage, 'post');
        imageUrl = uploadRes.url;
      }

      await SocialService.createPost({
        content: newPostContent,
        type: 'general',
        image_url: imageUrl || undefined
      });
      setNewPostContent('');
      setNewPostImage(null);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setSendingPost(false);
    }
  };

  const pickImageForPost = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewPostImage(result.assets[0].uri);
    }
  };

  const handleLikePost = async (post: Post) => {
    if (!currentUser) return;
    try {
      // Optimistic Update
      const isLiked = post.likes.includes(currentUser.id!);
      const newLikes = isLiked
        ? post.likes.filter(id => id !== currentUser.id)
        : [...post.likes, currentUser.id!];

      setPosts(posts.map(p =>
        p.id === post.id
          ? { ...p, likes: newLikes, likes_count: newLikes.length }
          : p
      ));

      await SocialService.toggleLike(post.id, currentUser.id!);
    } catch (error) {
      fetchData(); // Revert
    }
  };

  const handleCreateMatch = async () => {
    if (!currentUser) return;
    try {
      await SocialService.createMatch({
        host_user_id: currentUser.id!,
        sport_type: newMatchData.sport,
        match_type: newMatchData.type,
        date: newMatchData.date || 'Tomorrow',
        time: newMatchData.time || '8:00 PM',
        location: newMatchData.location || 'DHA Courts',
        max_players: parseInt(newMatchData.maxPlayers) || 4
      });
      setIsMatchModalVisible(false);
      fetchData();
      Alert.alert('Success', 'Match created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create match');
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    if (!currentUser) return;
    try {
      await SocialService.joinMatch(matchId, currentUser.id!);
      fetchData();
      Alert.alert('Success', 'You joined the match!');
    } catch (error) {
      // Backend returns error if full or already joined
      // Ideally parse error message
      Alert.alert('Error', 'Failed to join match (Full or Already Joined)');
    }
  };

  const tabs = [
    { id: 'forum', label: 'Forum', icon: 'newspaper-outline' },
    { id: 'matches', label: 'Matches', icon: 'tennisball-outline' },
    { id: 'chats', label: 'Chats', icon: 'chatbubbles-outline' },
    { id: 'leaderboard', label: 'Ranking', icon: 'trophy-outline' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <Text style={styles.title}>Social Hub</Text>
          <Text style={styles.subtitle}>Connect • Compete • Conquer</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? COLORS.textDark : COLORS.textMuted}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}

      {!loading && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* FORUM TAB */}
          {activeTab === 'forum' && (
            <View>
              {/* Create Post */}
              <Card style={styles.createPostCard}>
                <View style={styles.createPostContainer}>
                  <Image source={{ uri: currentUser?.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.userAvatarSmall} />
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.createPostInput}
                      placeholder="Share something..."
                      placeholderTextColor={COLORS.textMuted}
                      value={newPostContent}
                      onChangeText={setNewPostContent}
                    />
                    {newPostImage && (
                      <View style={{ marginTop: 8 }}>
                        <Image source={{ uri: newPostImage }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                        <TouchableOpacity onPress={() => setNewPostImage(null)} style={{ position: 'absolute', right: -5, top: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: 'white', fontWeight: 'bold' }}>X</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={pickImageForPost} style={{ padding: 8 }}>
                    <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postButton} onPress={handleCreatePost} disabled={sendingPost}>
                    {sendingPost ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
                  </TouchableOpacity>
                </View>
              </Card>

              {/* Posts */}
              {posts.map((item) => (
                <Card key={item.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.authorInfo}>
                      <Image source={{ uri: item.author?.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.postAvatar} />
                      <View>
                        <Text style={styles.authorName}>{item.author?.name || 'Unknown User'}</Text>
                        <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.postContent}>{item.content}</Text>
                  {item.image_url && (
                    <Image
                      source={{ uri: getMediaUrl(item.image_url) }}
                      style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 10 }}
                    />
                  )}

                  <View style={styles.postFooter}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLikePost(item)}>
                      <Ionicons
                        name={item.likes?.includes(currentUser?.id || '') ? "heart" : "heart-outline"}
                        size={20}
                        color={item.likes?.includes(currentUser?.id || '') ? "red" : COLORS.textMuted}
                      />
                      <Text style={styles.actionText}>{item.likes_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={20} color={COLORS.textMuted} />
                      <Text style={styles.actionText}>{item.comments_count || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* MATCHES TAB */}
          {activeTab === 'matches' && (
            <View>
              <View style={styles.matchHeader}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search matches..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      // Debounce should be here in real app, but for now we rely on explicit re-fetch triggers or effect deps?
                      // Effect dep includes activeTab, selectedFilter. SearchQuery is not in dep.
                      // I should add a search button or debounce effect.
                      // For simplicity, let's just add a button or make effect watch searchQuery with debounce.
                      // For now, let's make the effect watch searchQuery.
                    }}
                    onEndEditing={fetchData} // Trigger fetch on submit
                  />
                </View>
                <TouchableOpacity style={styles.createMatchButton} onPress={() => setIsMatchModalVisible(true)}>
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                {['All', 'Padel', 'Tennis', 'Badminton', 'Futsal', 'Cricket'].map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    onPress={() => setSelectedFilter(sport)}
                    style={[styles.filterChip, selectedFilter === sport && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, selectedFilter === sport && styles.filterTextActive]}>{sport}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {matches.map((match) => (
                <TouchableOpacity key={match.id} activeOpacity={0.9}>
                  <Card style={styles.matchCard}>
                    <View style={styles.matchCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="trophy" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.matchSport}>{match.sport_type}</Text>
                        <View style={[styles.typeBadge, match.match_type === 'ranked' && styles.typeBadgeRanked]}>
                          <Text style={styles.typeText}>{match.match_type.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={styles.playersIndicator}>
                        <Ionicons name="people" size={14} color={COLORS.textDark} style={{ marginRight: 4 }} />
                        <Text style={styles.playersText}>{match.current_players}/{match.max_players}</Text>
                      </View>
                    </View>

                    <View style={styles.matchDetails}>
                      <View style={styles.matchDetailRow}>
                        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.matchDetailText}>{match.date} • {match.time}</Text>
                      </View>
                      <View style={styles.matchDetailRow}>
                        <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.matchDetailText}>{match.location}</Text>
                      </View>
                    </View>

                    <View style={styles.matchFooter}>
                      <View style={styles.hostInfo}>
                        <Text style={styles.hostText}>Host: {match.participants?.[0]?.name || 'Unknown'}</Text>
                      </View>
                      <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinMatch(match.id)}>
                        <Text style={styles.joinButtonText}>Join Match</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* CHATS TAB */}
          {activeTab === 'chats' && (
            <View>
              <View style={[styles.searchContainer, { marginBottom: 16 }]}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search messages..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {(chats || []).map((chat: any) => (
                <TouchableOpacity key={chat.id} style={styles.chatCard} activeOpacity={0.7} onPress={() => router.push(`/chat/${chat.id}`)}>
                  <View style={styles.chatAvatarContainer}>
                    <Image source={{ uri: 'https://i.pravatar.cc/150' }} style={styles.chatAvatar} />
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.chatName}>Chat {chat.id.substring(0, 6)}</Text>
                      <Text style={styles.chatTime}>{new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={styles.chatMessageRow}>
                      <Text style={styles.chatMessage} numberOfLines={1}>
                        {chat.last_message || 'No messages yet'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {chats.length === 0 && (
                <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: 20 }}>No conversations found.</Text>
              )}
            </View>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <View>
              {leaderboard.map((user, index) => (
                <Card key={user.id} style={styles.leaderboardItem}>
                  <Text style={{ width: 30, fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>#{index + 1}</Text>
                  <Image source={{ uri: user.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.userAvatarSmall} />
                  <Text style={{ flex: 1, color: COLORS.text, fontWeight: '600', marginLeft: 10 }}>{user.name}</Text>
                  <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>{user.points} pts</Text>
                </Card>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Create Match Modal */}
      <Modal visible={isMatchModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Match</Text>
            {/* Simplified inputs for brevity */}
            <TextInput style={styles.input} placeholder="Sport (e.g. Padel)" value={newMatchData.sport} onChangeText={t => setNewMatchData({ ...newMatchData, sport: t })} />
            <TextInput style={styles.input} placeholder="Location" value={newMatchData.location} onChangeText={t => setNewMatchData({ ...newMatchData, location: t })} />
            <TextInput style={styles.input} placeholder="Time" value={newMatchData.time} onChangeText={t => setNewMatchData({ ...newMatchData, time: t })} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <Button title="Cancel" variant="outline" onPress={() => setIsMatchModalVisible(false)} />
              <Button title="Create" onPress={handleCreateMatch} />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: 16, backgroundColor: COLORS.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerGradient: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -20, borderRadius: 16, padding: 4, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: COLORS.secondary },
  tabText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.textDark },
  content: { flex: 1, padding: 16 },

  // Post Styles
  createPostCard: { marginBottom: 16, padding: 12 },
  createPostContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  userAvatarSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  createPostInput: { flex: 1, color: COLORS.text, fontSize: 16, minHeight: 40, textAlignVertical: 'top' },
  postButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-end', marginLeft: 8 },
  postButtonText: { color: '#fff', fontWeight: 'bold' },

  postCard: { marginBottom: 16 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  authorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  postTime: { fontSize: 12, color: COLORS.textMuted },
  postContent: { fontSize: 16, color: COLORS.text, lineHeight: 24, marginBottom: 12 },
  postFooter: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { marginLeft: 6, color: COLORS.textMuted },

  // Match Styles
  matchHeader: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 10, color: COLORS.text },
  createMatchButton: { width: 48, height: 48, backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  filtersScroll: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.card, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  matchCard: { marginBottom: 16 },
  matchCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  matchSport: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: COLORS.secondary },
  typeBadgeRanked: { backgroundColor: '#ffd70033' },
  typeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary },
  playersIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  playersText: { fontSize: 12, fontWeight: '600', color: COLORS.textDark },
  matchDetails: { marginBottom: 16 },
  matchDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  matchDetailText: { marginLeft: 8, color: COLORS.text, opacity: 0.8 },
  matchFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hostInfo: {},
  hostText: { fontSize: 12, color: COLORS.textMuted },
  joinButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  joinButtonText: { color: '#fff', fontWeight: 'bold' },

  // Chat Styles
  chatCard: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  chatAvatarContainer: { position: 'relative', marginRight: 16 },
  chatAvatar: { width: 50, height: 50, borderRadius: 25 },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  chatTime: { fontSize: 12, color: COLORS.textMuted },
  chatMessageRow: { flexDirection: 'row', alignItems: 'center' },
  chatMessage: { flex: 1, color: COLORS.textMuted, fontSize: 14 },

  // Leaderboard Styles
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.card, padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.background, padding: 12, borderRadius: 12, marginBottom: 12, color: COLORS.text }
});
