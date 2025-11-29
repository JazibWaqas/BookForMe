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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your JHAT assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I understand you\'re looking for a booking. Let me help you with that!',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>Ask me anything about bookings</Text>
      </View>

      <ScrollView style={styles.messages}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageContainer, message.sender === 'user' ? styles.userMessage : styles.botMessage]}
          >
            <View
              style={[styles.bubble, message.sender === 'user' ? styles.userBubble : styles.botBubble]}
            >
              <Text style={[styles.messageText, message.sender === 'user' ? styles.userText : styles.botText]}>
                {message.text}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={styles.sendButton}
        >
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  messages: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
  },
  botBubble: {
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  messageText: {
    fontSize: 14,
  },
  userText: {
    color: COLORS.textDark,
  },
  botText: {
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.backgroundLight,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: COLORS.textDark,
    fontSize: 18,
  },
});

