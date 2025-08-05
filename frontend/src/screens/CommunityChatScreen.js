import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeProvider';

const chatData = [
  {
    id: 1,
    author: 'Ahmed Khan',
    avatar: '👨',
    location: 'DHA Phase 6',
    time: '2 minutes ago',
    content: 'Anyone know a good electrician in the area? Need someone reliable.',
    likes: 5,
    comments: 3,
    verified: false,
  },
  {
    id: 2,
    author: 'Karachi Police',
    avatar: '👮',
    location: 'Saddar',
    time: '15 minutes ago',
    content: 'Regular patrol increased in DHA Phase 6. Report any suspicious activity on emergency number 15.',
    likes: 12,
    comments: 2,
    verified: true,
  },
  {
    id: 3,
    author: 'Fatima Ali',
    avatar: '👩',
    location: 'Clifton Block 2',
    time: '1 hour ago',
    content: 'Great job by the security guards last night! Feeling much safer in our neighborhood.',
    likes: 8,
    comments: 1,
    verified: false,
  },
  {
    id: 4,
    author: 'Community Admin',
    avatar: '🏘️',
    location: 'DHA Phase 6',
    time: '2 hours ago',
    content: 'Monthly security meeting scheduled for this Saturday at 7 PM. All residents welcome to attend.',
    likes: 15,
    comments: 5,
    verified: true,
  },
  {
    id: 5,
    author: 'Mohammed Hassan',
    avatar: '👨‍🦳',
    location: 'Gulshan-e-Iqbal',
    time: '3 hours ago',
    content: 'Power outage in Block 7. K-Electric informed, expected restoration by 6 PM.',
    likes: 6,
    comments: 4,
    verified: false,
  },
];

const topics = [
  { id: 'all', name: 'All Posts', icon: 'grid' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'utilities', name: 'Utilities', icon: 'flash' },
  { id: 'services', name: 'Services', icon: 'construct' },
  { id: 'events', name: 'Events', icon: 'calendar' },
];

export default function CommunityChatScreen() {
  const { theme } = useTheme();
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const scrollViewRef = useRef();

  const styles = getStyles(theme);

  const handlePost = async () => {
    if (!newPost.trim()) {
      Alert.alert('Error', 'Please enter a message to post');
      return;
    }

    setIsPosting(true);

    // Simulate API call
    setTimeout(() => {
      setIsPosting(false);
      setNewPost('');
      Alert.alert('Success', 'Your post has been shared with the community!');
    }, 1500);
  };

  const handleLike = (postId) => {
    Alert.alert('Like', 'Post liked!');
  };

  const handleComment = (postId) => {
    Alert.alert('Comment', 'Comment feature coming soon!');
  };

  const handleShare = (postId) => {
    Alert.alert('Share', 'Sharing post...');
  };

  const renderPost = (post) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postAvatar}>{post.avatar}</Text>
        <View style={styles.postInfo}>
          <View style={styles.postAuthorRow}>
            <Text style={styles.postAuthor}>{post.author}</Text>
            {post.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
            )}
          </View>
          <Text style={styles.postLocation}>{post.location}</Text>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
        <TouchableOpacity style={styles.postMenu}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.postContent}>{post.content}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.postAction}
          onPress={() => handleLike(post.id)}
        >
          <Ionicons name="heart-outline" size={18} color="#9ca3af" />
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.postAction}
          onPress={() => handleComment(post.id)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.postAction}
          onPress={() => handleShare(post.id)}
        >
          <Ionicons name="share-outline" size={18} color="#9ca3af" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Topics Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topicsContainer}
        contentContainerStyle={styles.topicsContent}
      >
        {topics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[
              styles.topicButton,
              selectedTopic === topic.id && styles.topicButtonActive
            ]}
            onPress={() => setSelectedTopic(topic.id)}
          >
            <Ionicons
              name={topic.icon}
              size={18}
              color={selectedTopic === topic.id ? '#3b82f6' : '#6b7280'}
            />
            <Text
              style={[
                styles.topicText,
                selectedTopic === topic.id && styles.topicTextActive
              ]}
            >
              {topic.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Posts */}
      <ScrollView 
        style={styles.postsContainer} 
        showsVerticalScrollIndicator={false}
        ref={scrollViewRef}
      >
        {chatData.map(renderPost)}
      </ScrollView>

      {/* New Post Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Share something with your community..."
            placeholderTextColor="#9ca3af"
            value={newPost}
            onChangeText={setNewPost}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!newPost.trim() || isPosting}
          >
            {isPosting ? (
              <Ionicons name="reload" size={20} color="white" style={styles.spinner} />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
  },
  topicsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  topicsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  topicButtonActive: {
    backgroundColor: '#dbeafe',
  },
  topicText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  topicTextActive: {
    color: '#3b82f6',
  },
  postsContainer: {
    flex: 1,
    padding: 16,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 4,
  },
  postLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  postTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  postMenu: {
    padding: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 8,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  spinner: {
    marginRight: 0,
  },
}); 