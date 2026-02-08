import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CommentsModal from '../../components/social/CommentsModal';
import LeaderboardPodium from '../../components/social/LeaderboardPodium';
import LeaderboardRow from '../../components/social/LeaderboardRow';
import MatchSwiper from '../../components/social/MatchSwiper';
import FriendsTab from '../../components/social/FriendsTab';
import { COLORS } from '../../constants/colors';
import { API_BASE_URL, getMediaUrl } from '../../config/api';
import { SocialService, Post, Match, UserProfileSocial } from '../../services/social';
import { authService, UserData } from '../../services/auth';
import { useSocialFeed, useSocialMatches, useSocialLeaderboard } from '../../hooks/useQueries';
import React, { useState, useEffect } from 'react';

export default function SocialScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'forum' | 'matches' | 'chats' | 'friends' | 'leaderboard'>('forum');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // React Query Hooks (Cached Data)
  // MOVED: defined below after state

  const [posts, setPosts] = useState<Post[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfileSocial[]>([]);
  const [loading, setLoading] = useState(false);

  // Effects moved below hooks to avoid ReferenceErrors

  // Data States
  // ... deleted old state declarations that are now above ...

  // Input States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // React Query Hooks (Moved here to access selectedFilter)
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useSocialFeed('all');
  const { data: matchesData, isLoading: matchesLoading, refetch: refetchMatches } = useSocialMatches(selectedFilter === 'All' ? 'all' : selectedFilter);
  const { data: leaderboardData, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useSocialLeaderboard();

  // --- Sync Effects (Moved here) ---
  useEffect(() => {
    if (feedData) {
      if (!searchQuery) {
        setPosts(feedData);
      } else {
        setPosts(feedData.filter((p: Post) => (p.content || '').toLowerCase().includes(searchQuery.toLowerCase())));
      }
    }
  }, [feedData, searchQuery]);

  useEffect(() => {
    if (matchesData) {
      setMatches(matchesData);
    }
  }, [matchesData]);

  useEffect(() => {
    if (leaderboardData) setLeaderboard(leaderboardData);
  }, [leaderboardData]);


  // Post Creation States
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [sendingPost, setSendingPost] = useState(false);

  // Match Creation States
  const [isMatchModalVisible, setIsMatchModalVisible] = useState(false);
  const [newMatchData, setNewMatchData] = useState<{
    sport: string; date: string; time: string; location: string; maxPlayers: string; type: string; slot_id?: string;
  }>({ sport: 'Padel', date: '', time: '', location: '', maxPlayers: '4', type: 'casual' });

  // Match View Mode
  const [matchViewMode, setMatchViewMode] = useState<'swipe' | 'list'>('swipe');

  // Comments State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  // Removed old manual fetchData useEffect
  // useEffect(() => { fetchData(); }, [activeTab, selectedFilter]);

  const loadUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    if (user && activeTab === 'chats') {
      loadChats(user.id);
    }
  };

  const loadChats = async (userId: string) => {
    setLoading(true);
    try {
      const chatList = await SocialService.getConversations(userId);
      const filteredChats = searchQuery
        ? chatList.filter((c: any) => c.last_message?.toLowerCase().includes(searchQuery.toLowerCase()))
        : chatList;
      setChats(filteredChats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  // Refresh handler (renamed to fetchData for compatibility)
  const fetchData = async () => {
    if (activeTab === 'forum') await refetchFeed();
    if (activeTab === 'matches') await refetchMatches();
    if (activeTab === 'leaderboard') await refetchLeaderboard();
    if (activeTab === 'chats' && currentUser) loadChats(currentUser.id);
  };


  // --- Handlers ---

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && !newPostImage) || !currentUser) return;

    setSendingPost(true);
    try {
      let imageUrl = null;
      if (newPostImage) {
        console.log('📤 Uploading image:', newPostImage);
        const uploadRes = await SocialService.uploadFile(newPostImage, 'post');
        console.log('✅ Upload response:', uploadRes);
        imageUrl = uploadRes.url;
        console.log('🔗 Image URL:', imageUrl);
      }

      const postData = {
        content: newPostContent,
        type: 'general',
        image_url: imageUrl || undefined
      };
      console.log('📝 Creating post with data:', postData);

      await SocialService.createPost(postData);
      console.log('✅ Post created successfully');

      setNewPostContent('');
      setNewPostImage(null);
      fetchData();
    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      Alert.alert('Error', `Failed to create post: ${error.message || 'Unknown error'}`);
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
      console.log('👍 Liking post:', post.id);
      console.log('   Current likes:', post.likes);
      console.log('   Current likes_count:', post.likes_count);

      // Optimistic Update
      const isLiked = (post.likes || []).includes(currentUser.id!);
      const newLikes = isLiked
        ? (post.likes || []).filter(id => id !== currentUser.id)
        : [...(post.likes || []), currentUser.id!];

      console.log('   New likes array:', newLikes);
      console.log('   New likes_count:', newLikes.length);

      setPosts(posts.map(p =>
        p.id === post.id
          ? { ...p, likes: newLikes, likes_count: newLikes.length }
          : p
      ));

      const response = await SocialService.toggleLike(post.id, currentUser.id!);
      console.log('✅ Backend response:', response);
    } catch (error: any) {
      console.error('❌ Like failed:', error);
      fetchData(); // Revert
    }
  };

  const handleOpenComments = (post: Post) => {
    setSelectedPostId(post.id);
    setIsCommentsVisible(true);
  };

  const handleCommentPosted = (postId: string) => {
    // Optimistically update comment count
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, comments_count: p.comments_count + 1 }
        : p
    ));
  };

  const handleCloseComments = () => {
    setIsCommentsVisible(false);
    setSelectedPostId(null);
    // Refresh posts to get updated counts
    refetchFeed();
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
        max_players: parseInt(newMatchData.maxPlayers) || 4,
        slot_id: newMatchData.slot_id
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
    { id: 'friends', label: 'Friends', icon: 'people-outline' },
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
                  <Image source={{ uri: (currentUser as any)?.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.userAvatarSmall} />
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
                        name={(item.likes || []).includes(currentUser?.id || '') ? "heart" : "heart-outline"}
                        size={20}
                        color={(item.likes || []).includes(currentUser?.id || '') ? "red" : COLORS.textMuted}
                      />
                      <Text style={styles.actionText}>{item.likes_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenComments(item)}>
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
            <View style={{ flex: 1 }}>
              {/* Header with search and toggle */}
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
                    }}
                    onEndEditing={fetchData}
                  />
                </View>
                <TouchableOpacity style={styles.createMatchButton} onPress={() => setIsMatchModalVisible(true)}>
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* View Mode Toggle */}
              <View style={styles.viewModeToggle}>
                <TouchableOpacity
                  style={[styles.viewModeButton, matchViewMode === 'swipe' && styles.viewModeButtonActive]}
                  onPress={() => setMatchViewMode('swipe')}
                >
                  <Ionicons name="layers" size={18} color={matchViewMode === 'swipe' ? '#fff' : COLORS.textMuted} />
                  <Text style={[styles.viewModeText, matchViewMode === 'swipe' && styles.viewModeTextActive]}>Swipe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewModeButton, matchViewMode === 'list' && styles.viewModeButtonActive]}
                  onPress={() => setMatchViewMode('list')}
                >
                  <Ionicons name="list" size={18} color={matchViewMode === 'list' ? '#fff' : COLORS.textMuted} />
                  <Text style={[styles.viewModeText, matchViewMode === 'list' && styles.viewModeTextActive]}>List</Text>
                </TouchableOpacity>
              </View>

              {/* Sport Filter Chips */}
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

              {/* Swipe View */}
              {matchViewMode === 'swipe' && (
                <View style={{ flex: 1, minHeight: 550 }}>
                  <MatchSwiper
                    matches={matches}
                    onJoinMatch={handleJoinMatch}
                    onRefresh={fetchData}
                  />
                </View>
              )}

              {/* List View */}
              {matchViewMode === 'list' && matches.map((match) => (
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

          {/* FRIENDS TAB */}
          {activeTab === 'friends' && currentUser && (
            <FriendsTab
              currentUserId={currentUser.id}
              onChatWithFriend={(userId) => router.push(`/chat/${userId}`)}
            />
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <View>
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <LeaderboardPodium topThree={leaderboard.slice(0, 3)} />
              )}

              {/* Your Rank Highlight */}
              {currentUser && (
                <View style={styles.yourRankCard}>
                  <Text style={styles.yourRankLabel}>📊 YOUR RANK</Text>
                  <View style={styles.yourRankContent}>
                    <Text style={styles.yourRankNumber}>
                      #{leaderboard.findIndex(u => u.id === currentUser.id) + 1 || 'N/A'}
                    </Text>
                    <View style={styles.yourRankProgress}>
                      <View style={styles.yourRankProgressBar}>
                        <View style={[styles.yourRankProgressFill, { width: '65%' }]} />
                      </View>
                      <Text style={styles.yourRankProgressText}>
                        {leaderboard.find(u => u.id === currentUser.id)?.points || 0} pts
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Rest of Leaderboard */}
              <View style={{ marginTop: 8 }}>
                {leaderboard.slice(3).map((user, index) => (
                  <LeaderboardRow
                    key={user.id}
                    user={user}
                    rank={index + 4}
                    isCurrentUser={currentUser?.id === user.id}
                  />
                ))}
              </View>

              {leaderboard.length === 0 && (
                <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: 40 }}>
                  No rankings available yet. Start playing to earn points!
                </Text>
              )}
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

            {/* Booking Selection (Handshake) */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.textMuted, marginBottom: 8 }}>Link to Booking (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.bookingChip,
                    !newMatchData.slot_id && styles.bookingChipActive
                  ]}
                  onPress={() => setNewMatchData({ ...newMatchData, slot_id: undefined, location: '', date: '', time: '' })}
                >
                  <Text style={!newMatchData.slot_id ? styles.bookingChipTextActive : styles.bookingChipText}>None (Custom)</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Sport (e.g. Padel, Futsal, Tennis)"
              value={newMatchData.sport}
              onChangeText={t => setNewMatchData({ ...newMatchData, sport: t })}
            />
            <TextInput
              style={[styles.input, newMatchData.slot_id && styles.inputDisabled]}
              placeholder="Location"
              value={newMatchData.location}
              editable={!newMatchData.slot_id}
              onChangeText={t => setNewMatchData({ ...newMatchData, location: t })}
            />

            {/* Date Selection */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {['Today', 'Tomorrow', 'Saturday', 'Sunday'].map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.bookingChip, newMatchData.date === d && styles.bookingChipActive]}
                    onPress={() => !newMatchData.slot_id && setNewMatchData({ ...newMatchData, date: d })}
                    disabled={!!newMatchData.slot_id}
                  >
                    <Text style={newMatchData.date === d ? styles.bookingChipTextActive : styles.bookingChipText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.input, newMatchData.slot_id && styles.inputDisabled]}
                placeholder="Or enter date (YYYY-MM-DD)"
                value={newMatchData.date}
                editable={!newMatchData.slot_id}
                onChangeText={t => setNewMatchData({ ...newMatchData, date: t })}
              />
            </View>

            {/* Time Selection */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {['7:00 AM', '9:00 AM', '5:00 PM', '7:00 PM', '9:00 PM'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.bookingChip, newMatchData.time === t && styles.bookingChipActive]}
                    onPress={() => !newMatchData.slot_id && setNewMatchData({ ...newMatchData, time: t })}
                    disabled={!!newMatchData.slot_id}
                  >
                    <Text style={newMatchData.time === t ? styles.bookingChipTextActive : styles.bookingChipText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.input, newMatchData.slot_id && styles.inputDisabled]}
                placeholder="Or enter time (HH:MM)"
                value={newMatchData.time}
                editable={!newMatchData.slot_id}
                onChangeText={t => setNewMatchData({ ...newMatchData, time: t })}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <Button title="Cancel" variant="outline" onPress={() => setIsMatchModalVisible(false)} />
              <Button title="Create" onPress={handleCreateMatch} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      {
        selectedPostId && (
          <CommentsModal
            visible={isCommentsVisible}
            postId={selectedPostId}
            onClose={handleCloseComments}
            onCommentPosted={handleCommentPosted}
          />
        )
      }

    </View >
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

  // Picker Styles
  pickerContainer: { marginBottom: 12 },
  pickerLabel: { color: COLORS.textMuted, marginBottom: 8, fontSize: 12, marginLeft: 4 },

  // Match Styles
  matchHeader: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 10, color: COLORS.text },
  createMatchButton: { width: 48, height: 48, backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  viewModeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  viewModeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  viewModeText: {
    marginLeft: 6,
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  viewModeTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },
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
  yourRankCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  yourRankLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8
  },
  yourRankContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  yourRankNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 16
  },
  yourRankProgress: {
    flex: 1
  },
  yourRankProgressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden'
  },
  yourRankProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4
  },
  yourRankProgressText: {
    fontSize: 12,
    color: COLORS.textMuted
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.card, padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.background, padding: 12, borderRadius: 12, marginBottom: 12, color: COLORS.text },
  inputDisabled: { opacity: 0.5 },
  bookingChip: { padding: 8, borderRadius: 8, backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  bookingChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bookingChipText: { color: COLORS.textMuted },
  bookingChipTextActive: { color: '#fff', fontWeight: 'bold' }
});
