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

export default function ChatbotAssistant({ onClose }) {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m your KHI Safe assistant. How can I help you today?',
      isBot: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickActions = [
    { id: 1, text: 'Emergency numbers', icon: 'call' },
    { id: 2, text: 'Safety tips', icon: 'shield' },
    { id: 3, text: 'Report incident', icon: 'warning' },
    { id: 4, text: 'Find services', icon: 'search' },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      const userMessage = {
        id: messages.length + 1,
        text: message,
        isBot: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...messages, userMessage]);
      setMessage('');

      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: getBotResponse(message),
          isBot: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const handleQuickAction = (action) => {
    setMessage(action.text);
    handleSendMessage();
  };

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('help')) {
      return 'For immediate emergencies:\n• Police: 15\n• Rescue: 1122\n• Fire: 16\n• Ambulance: 115\n\nIs there anything specific I can help you with?';
    } else if (lowerMessage.includes('safety') || lowerMessage.includes('tips')) {
      return 'Here are some safety tips:\n• Avoid displaying expensive items\n• Stay in well-lit areas at night\n• Keep emergency contacts handy\n• Use official transportation\n• Trust your instincts';
    } else if (lowerMessage.includes('report') || lowerMessage.includes('incident')) {
      return 'To report an incident:\n1. Go to the "Report" tab\n2. Select incident type\n3. Provide details and location\n4. Add photos if possible\n5. Submit the report\n\nWould you like me to guide you there?';
    } else if (lowerMessage.includes('services') || lowerMessage.includes('find')) {
      return 'You can find local services in the "Near Me" section:\n• Food & Restaurants\n• Shopping centers\n• Emergency services\n• Healthcare facilities\n• Utilities (plumber, electrician)\n\nWhat type of service are you looking for?';
    } else {
      return 'I understand you\'re asking about "' + userMessage + '". I can help you with:\n• Emergency information\n• Safety tips\n• Reporting incidents\n• Finding local services\n\nWhat would you like to know more about?';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    botAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    headerTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: fontSize.sm,
      color: colors.success,
    },
    closeButton: {
      padding: spacing.xs,
    },
    chatContainer: {
      flex: 1,
    },
    messagesList: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    messageItem: {
      marginVertical: spacing.sm,
      maxWidth: '80%',
    },
    userMessage: {
      alignSelf: 'flex-end',
    },
    botMessage: {
      alignSelf: 'flex-start',
    },
    messageBubble: {
      padding: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    userBubble: {
      backgroundColor: colors.primary,
    },
    botBubble: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    userText: {
      color: 'white',
    },
    botText: {
      color: colors.text,
    },
    messageTime: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginTop: spacing.xs,
      textAlign: 'right',
    },
    quickActionsContainer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    quickActionsTitle: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    quickActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionIcon: {
      marginRight: spacing.xs,
    },
    quickActionText: {
      fontSize: fontSize.sm,
      color: colors.text,
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
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.textMuted,
    },
  });

  const renderMessage = ({ item }) => (
    <View style={[styles.messageItem, item.isBot ? styles.botMessage : styles.userMessage]}>
      <View style={[styles.messageBubble, item.isBot ? styles.botBubble : styles.userBubble]}>
        <Text style={[styles.messageText, item.isBot ? styles.botText : styles.userText]}>
          {item.text}
        </Text>
      </View>
      <Text style={styles.messageTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble" size={20} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>KHI Safe Assistant</Text>
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Chat Container */}
      <View style={styles.chatContainer}>
        {/* Messages List */}
        <FlatList
          style={styles.messagesList}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />

        {/* Quick Actions */}
        {messages.length === 1 && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionButton}
                  onPress={() => handleQuickAction(action)}
                >
                  <Ionicons
                    name={action.icon}
                    size={16}
                    color={colors.text}
                    style={styles.quickActionIcon}
                  />
                  <Text style={styles.quickActionText}>{action.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}