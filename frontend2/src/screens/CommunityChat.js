import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeProvider';
import Header from '../components/Header';

export default function CommunityChat() {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [activeChannel, setActiveChannel] = useState('general');
  const [message, setMessage] = useState('');

  const channels = [
    { id: 'general', name: 'General Discussion', icon: 'chatbubbles', memberCount: 142 },
    { id: 'safety', name: 'Safety Alerts', icon: 'shield', memberCount: 89 },
    { id: 'events', name: 'Community Events', icon: 'calendar', memberCount: 67 },
    { id: 'marketplace', name: 'Buy & Sell', icon: 'storefront', memberCount: 124 },
  ];

  const messages = {
    general: [
      {
        id: 1,
        user: 'Ahmed Khan',
        avatar: 'AK',
        message: 'Good morning everyone! How is the weather in DHA today?',
        time: '9:30 AM',
        isOnline: true,
      },
      {
        id: 2,
        user: 'Sarah Ali',
        avatar: 'SA',
        message: 'Weather is great! Perfect for a morning walk in the park.',
        time: '9:32 AM',
        isOnline: true,
      },
      {
        id: 3,
        user: 'Mohammad Rizwan',
        avatar: 'MR',
        message: 'Has anyone noticed increased police patrol in Block 5? Feeling much safer!',
        time: '9:35 AM',
        isOnline: false,
      },
    ],
    safety: [
      {
        id: 1,
        user: 'Security Team',
        avatar: 'ST',
        message: 'ALERT: Please be cautious near KDA Chowrangi. Traffic accident reported.',
        time: '8:15 AM',
        isOnline: true,
        isAlert: true,
      },
    ],
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending logic here
      setMessage('');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      margin: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      width: 40,
      height: 40,
      backgroundColor: '#E0E7FF',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    channelTabs: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    channelTab: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.sm,
      marginRight: spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      minWidth: 120,
    },
    channelTabActive: {
      borderColor: colors.primary,
      backgroundColor: '#EBF8FF',
    },
    channelTabContent: {
      alignItems: 'center',
    },
    channelIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
      backgroundColor: colors.card,
    },
    channelIconActive: {
      backgroundColor: '#DBEAFE',
    },
    channelName: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
    channelNameActive: {
      color: colors.primary,
    },
    channelMembers: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
    },
    chatContainer: {
      flex: 1,
      backgroundColor: colors.surface,
      marginHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chatTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    onlineIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
      marginRight: spacing.xs,
    },
    onlineText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    messagesList: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    messageItem: {
      flexDirection: 'row',
      marginVertical: spacing.sm,
      alignItems: 'flex-start',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    avatarText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: 'white',
    },
    messageContent: {
      flex: 1,
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    userName: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginRight: spacing.sm,
    },
    messageTime: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    messageText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    alertMessage: {
      backgroundColor: '#FEE2E2',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
    },
    alertMessageText: {
      color: '#991B1B',
      fontWeight: '500',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    messageInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.sm,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderMessage = ({ item }) => (
    <View style={styles.messageItem}>
      <View style={[styles.avatar, item.isAlert && { backgroundColor: '#EF4444' }]}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
        <View style={item.isAlert && styles.alertMessage}>
          <Text style={[styles.messageText, item.isAlert && styles.alertMessageText]}>
            {item.message}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Community" />
      
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="people" size={20} color="#6366F1" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Community Chat</Text>
            <Text style={styles.headerSubtitle}>Connect with your neighbors</Text>
          </View>
        </View>
      </View>

      {/* Channel Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelTabs}>
        {channels.map((channel) => (
          <TouchableOpacity
            key={channel.id}
            style={[
              styles.channelTab,
              activeChannel === channel.id && styles.channelTabActive,
            ]}
            onPress={() => setActiveChannel(channel.id)}
          >
            <View style={styles.channelTabContent}>
              <View
                style={[
                  styles.channelIcon,
                  activeChannel === channel.id && styles.channelIconActive,
                ]}
              >
                <Ionicons
                  name={channel.icon}
                  size={16}
                  color={activeChannel === channel.id ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.channelName,
                  activeChannel === channel.id && styles.channelNameActive,
                ]}
              >
                {channel.name}
              </Text>
              <Text style={styles.channelMembers}>{channel.memberCount} members</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chat Container */}
      <View style={styles.chatContainer}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>
            {channels.find(c => c.id === activeChannel)?.name}
          </Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>
              {channels.find(c => c.id === activeChannel)?.memberCount} online
            </Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          style={styles.messagesList}
          data={messages[activeChannel] || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}