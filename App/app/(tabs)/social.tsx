import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../components/ui/Card';
import CommentsModal from '../../components/social/CommentsModal';
import FriendsTab from '../../components/social/FriendsTab';
import Avatar from '../../components/ui/Avatar';
import { COLORS } from '../../constants/colors';
import { getMediaUrl } from '../../config/api';
import { SocialService, Post } from '../../services/social';
import { authService, UserData } from '../../services/auth';
import { useSocialFeed } from '../../hooks/useQueries';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SocialScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'forum' | 'chats' | 'friends'>('forum');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const { data: feedData, isLoading: feedLoading, isError: feedIsError, error: feedError, refetch: refetchFeed } = useSocialFeed('all');

  useEffect(() => {
    if (feedData) {
      if (!searchQuery) {
        setPosts(feedData);
      } else {
        setPosts(feedData.filter((p: Post) => (p.content || '').toLowerCase().includes(searchQuery.toLowerCase())));
      }
    }
  }, [feedData, searchQuery]);

  // Post Creation States
  const [newPostContent, setNewPostContent] = useState('');
  const [sendingPost, setSendingPost] = useState(false);

  // Comments State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (activeTab === 'chats' && currentUser?.id) {
      loadChats(currentUser.id);
    }
  }, [activeTab, currentUser?.id, searchQuery]);

  const loadUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const loadChats = async (userId: string) => {
    setChatsLoading(true);
    try {
      const chatList = await SocialService.getConversations(userId);
      const filteredChats = searchQuery
        ? chatList.filter((c: any) => (c.last_message || '').toLowerCase().includes(searchQuery.toLowerCase()))
        : chatList;
      setChats(filteredChats);
    } catch (err) {
      console.error(err);
      const detail = axios.isAxiosError(err) ? (err.response?.data as any)?.detail : null;
      Alert.alert('Error', typeof detail === 'string' ? detail : 'Could not load conversations.');
    } finally {
      setChatsLoading(false);
    }
  };

  const apiErrMessage = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const d = err.response?.data as any;
      if (typeof d?.detail === 'string') return d.detail;
      if (Array.isArray(d?.detail)) return d.detail.map((x: any) => x?.msg || String(x)).join(', ');
    }
    return err instanceof Error ? err.message : 'Something went wrong';
  };

  const requireUser = (): UserData | null => {
    if (!currentUser?.id) {
      Alert.alert('Sign in required', 'Log in to use Social features.');
      router.push('/(auth)/login');
      return null;
    }
    return currentUser;
  };

  const fetchData = async () => {
    if (activeTab === 'forum') await refetchFeed();
    if (activeTab === 'chats' && currentUser) loadChats(currentUser.id);
  };


  // --- Handlers ---

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    if (!requireUser()) return;

    setSendingPost(true);
    try {
      await SocialService.createPost({ content: newPostContent.trim(), type: 'general' });
      setNewPostContent('');
      fetchData();
    } catch (error: unknown) {
      Alert.alert('Error', `Failed to create post: ${apiErrMessage(error)}`);
    } finally {
      setSendingPost(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await SocialService.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
          } catch (error: unknown) {
            Alert.alert('Error', apiErrMessage(error));
          }
        },
      },
    ]);
  };

  const handleLikePost = async (post: Post) => {
    const u = requireUser();
    if (!u) return;
    try {
      const isLiked = (post.likes || []).includes(u.id!);
      const newLikes = isLiked
        ? (post.likes || []).filter(id => id !== u.id)
        : [...(post.likes || []), u.id!];

      setPosts(posts.map(p =>
        p.id === post.id
          ? { ...p, likes: newLikes, likes_count: newLikes.length }
          : p
      ));

      await SocialService.toggleLike(post.id);
    } catch (error: unknown) {
      await refetchFeed();
      Alert.alert('Error', apiErrMessage(error));
    }
  };

  const handleOpenComments = (post: Post) => {
    if (!requireUser()) return;
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

  const tabs = [
    { id: 'forum', label: 'Forum', icon: 'newspaper', color: '#3B82F6' },
    { id: 'chats', label: 'Chats', icon: 'chatbubbles', color: '#A855F7' },
    { id: 'friends', label: 'Friends', icon: 'people', color: '#EC4899' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['rgba(0, 208, 132, 0.15)', 'transparent']}
          style={styles.headerGradient}
        >
          <Text style={styles.title}>Social Hub</Text>
          <Text style={styles.subtitle}>Connect • Compete • Conquer</Text>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={[
                styles.tab,
                isActive && { backgroundColor: `${tab.color}15` }
              ]}
            >
              <Ionicons
                name={isActive ? tab.icon as any : `${tab.icon}-outline` as any}
                size={22}
                color={isActive ? tab.color : 'rgba(255,255,255,0.4)'}
                style={{ marginBottom: 4 }}
              />
              <Text style={[
                styles.tabText,
                isActive && { color: tab.color, fontWeight: '800' }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* FORUM TAB */}
          {activeTab === 'forum' && (
            <View>
              {feedIsError && (
                <Text style={styles.tabErrorText}>
                  Could not load feed. {apiErrMessage(feedError)}
                </Text>
              )}
              {feedLoading && posts.length === 0 && !feedIsError && (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
              )}
              {!feedLoading && !feedIsError && posts.length === 0 && (
                <Text style={styles.emptyTabText}>No posts yet. Share the first one above.</Text>
              )}
              {/* Create Post */}
              <Card style={styles.createPostCard}>
                <View style={styles.createPostContainer}>
                  <Avatar
                    uri={(currentUser as any)?.avatar_url}
                    name={currentUser?.name || 'You'}
                    size={44}
                    style={styles.userAvatarSmall}
                  />
                  <TextInput
                    style={[styles.createPostInput, { flex: 1 }]}
                    placeholder="Share something..."
                    placeholderTextColor={COLORS.textMuted}
                    value={newPostContent}
                    onChangeText={setNewPostContent}
                    multiline
                  />
                  <TouchableOpacity style={styles.postButton} onPress={handleCreatePost} disabled={sendingPost || !newPostContent.trim()}>
                    {sendingPost ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
                  </TouchableOpacity>
                </View>
              </Card>

              {/* Posts */}
              {posts.map((item) => (
                <View key={item.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.authorInfo}>
                      <View style={styles.avatarGlow}>
                        <Avatar
                          uri={item.author?.avatar_url?.startsWith('http') ? item.author.avatar_url : getMediaUrl(item.author?.avatar_url)}
                          name={item.author?.name || 'Unknown'}
                          size={44}
                          style={styles.postAvatar}
                        />
                      </View>
                      <View>
                        <Text style={styles.authorName}>{item.author?.name || 'Unknown User'}</Text>
                        <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    {item.user_id === currentUser?.id && (
                      <TouchableOpacity onPress={() => handleDeletePost(item.id)} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.postContent}>{item.content}</Text>

                  <View style={styles.postFooter}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLikePost(item)}>
                      <Ionicons
                        name={(item.likes || []).includes(currentUser?.id || '') ? "heart" : "heart-outline"}
                        size={22}
                        color={(item.likes || []).includes(currentUser?.id || '') ? "#EC4899" : "rgba(255,255,255,0.4)"}
                      />
                      <Text style={[styles.actionText, (item.likes || []).includes(currentUser?.id || '') && { color: '#EC4899' }]}>{item.likes_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenComments(item)}>
                      <Ionicons name="chatbubble-ellipses-outline" size={22} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.actionText}>{item.comments_count || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* CHATS TAB */}
          {activeTab === 'chats' && (
            <View>
              {!currentUser?.id && (
                <Text style={styles.emptyTabText}>Sign in to see your conversations.</Text>
              )}
              {chatsLoading && currentUser?.id && (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
              )}
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
                    <Avatar
                      uri={chat.other_user?.avatar_url?.startsWith('http') ? chat.other_user.avatar_url : getMediaUrl(chat.other_user?.avatar_url)}
                      name={chat.other_user?.name || 'User'}
                      size={52}
                      style={styles.chatAvatar}
                    />
                  </View>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.chatName}>{chat.other_user?.name || 'Unknown User'}</Text>
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

              {currentUser?.id && !chatsLoading && chats.length === 0 && (
                <Text style={styles.emptyTabText}>No conversations found.</Text>
              )}
            </View>
          )}

          {/* FRIENDS TAB */}
          {activeTab === 'friends' && currentUser && (
            <FriendsTab
              currentUserId={currentUser.id}
              onChatWithFriend={async (friendId) => {
                try {
                  // Create/get conversation first
                  const conv = await SocialService.startConversation(currentUser.id!, friendId);
                  router.push(`/chat/${conv.id}`);
                } catch (error) {
                  Alert.alert('Error', 'Failed to start chat');
                }
              }}
            />
          )}

          {activeTab === 'friends' && !currentUser && (
            <Text style={styles.emptyTabText}>Sign in to find friends and manage requests.</Text>
          )}

          <View style={{ height: 100 }} />
      </ScrollView>

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

    </View>
  );
}

const styles = StyleSheet.create({
  tabErrorText: {
    color: '#F87171',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  emptyTabText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 20,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  headerWrapper: { overflow: 'hidden', paddingBottom: 24 },
  headerGradient: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6, letterSpacing: 0.2 },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 20, marginTop: -40, borderRadius: 20, padding: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 14 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: 4 },
  tabTextActive: { color: '#FFF', fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20 },

  // Post Styles
  createPostCard: { marginBottom: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  createPostContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  userAvatarSmall: { marginRight: 14, borderWidth: 2, borderColor: '#3B82F6', borderRadius: 24 },
  createPostInput: { flex: 1, color: '#FFF', fontSize: 16, minHeight: 44, textAlignVertical: 'top' },
  postButton: { backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-end', marginLeft: 12 },
  postButtonText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  postCard: { marginBottom: 20, padding: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarGlow: { padding: 2, borderRadius: 26, backgroundColor: 'rgba(59, 130, 246, 0.2)', marginRight: 12 },
  postAvatar: { marginRight: 12 },
  authorName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  postTime: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: '600' },
  postContent: { fontSize: 15, color: 'rgba(255,255,255,0.95)', lineHeight: 24, marginBottom: 16 },
  postFooter: { flexDirection: 'row', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', rowGap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  actionText: { marginLeft: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  deleteButton: { padding: 6 },

  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchInput: { flex: 1, paddingVertical: 12, color: '#FFF', fontSize: 15 },

  // Chat Styles
  chatCard: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  chatAvatarContainer: { position: 'relative', marginRight: 16 },
  chatAvatar: {},
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  chatTime: { fontSize: 12, color: COLORS.textMuted },
  chatMessageRow: { flexDirection: 'row', alignItems: 'center' },
  chatMessage: { flex: 1, color: COLORS.textMuted, fontSize: 14 },
});
