import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const examplePrompts = [
    'Find the cheapest court available right now',
    'Show me the closest padel courts',
    'Tennis courts open tomorrow evening',
    'Best rated badminton courts in DHA',
  ];

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I found 3 courts matching your criteria:\n\nDHA Sports Complex\nPKR 800/hour • 2.3 km away • 4.8 rating\nAvailable now\n\nCourtside Arena\nPKR 1,000/hour • 3.1 km away • 4.9 rating\nAvailable from 6:00 PM\n\nElite Sports Club\nPKR 1,200/hour • 4.5 km away • 4.7 rating\nAvailable now\n\nWould you like to book any of these courts?',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Search</Text>
        <Text style={styles.subtitle}>Natural language court finder</Text>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messages} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>AI</Text>
              </View>
            </View>

            <Text style={styles.welcomeTitle}>How can I help you today?</Text>
            <Text style={styles.welcomeSubtitle}>
              Describe what you're looking for in plain language. I'll search our database and find the perfect court for you.
            </Text>

            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Examples</Text>
              {examplePrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleCard}
                  onPress={() => handleSend(prompt)}
                >
                  <Text style={styles.exampleText}>{prompt}</Text>
                  <Text style={styles.exampleArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.sender === 'user' ? styles.userRow : styles.botRow
                ]}
              >
                {message.sender === 'bot' && (
                  <View style={styles.avatarContainer}>
                    <View style={styles.botAvatar}>
                      <Text style={styles.botAvatarText}>AI</Text>
                    </View>
                  </View>
                )}

                <View style={styles.messageContent}>
                  {message.sender === 'bot' && (
                    <Text style={styles.senderLabel}>Assistant</Text>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      message.sender === 'user' ? styles.userBubble : styles.botBubble
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.sender === 'user' ? styles.userText : styles.botText
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                </View>

                {message.sender === 'user' && (
                  <View style={styles.avatarContainer}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>You</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message AI Search..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            onSubmitEditing={() => handleSend()}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            disabled={!input.trim()}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          AI can make mistakes. Verify court details before booking.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  messages: {
    flex: 1,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  examplesContainer: {
    width: '100%',
  },
  examplesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  exampleArrow: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginLeft: 12,
  },
  messageRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  userRow: {
    backgroundColor: COLORS.background,
  },
  botRow: {
    backgroundColor: COLORS.backgroundLight,
  },
  avatarContainer: {
    paddingTop: 4,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  messageContent: {
    flex: 1,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  bubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  userBubble: {
    alignItems: 'flex-end',
  },
  botBubble: {
    alignItems: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.text,
  },
  botText: {
    color: COLORS.text,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  sendButton: {
    position: 'absolute',
    right: 16,
    bottom: 6,
    width: 32,
    height: 32,
    backgroundColor: COLORS.text,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
  sendIcon: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
