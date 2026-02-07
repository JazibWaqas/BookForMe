
import React, { useState } from 'react';
import * as RN from 'react-native';
import { COLORS } from '../../constants/colors';
import { apiClient } from '../../config/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import VendorCard from '../../components/VendorCard';

const { width } = RN.Dimensions.get('window');

// --- AI SEARCH CONFIG ---
// You can change this to any Groq-supported model (e.g. "llama-3.3-70b-versatile", "mixtral-8x7b-32768", etc.)
const SELECTED_MODEL = "llama-3.3-70b-versatile";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  results?: any[];
  filters?: any;
}

export default function ChatbotScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const examplePrompts = [
    'Padel aaj raat khali hai DHA mein?',
    'Cheap futsal courts under 3000',
    'Cricket nets tomorrow morning',
    'Koi slot hai kal sham ko?',
  ];

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log(`🚀 Sending AI Search (${SELECTED_MODEL}):`, messageText);
      const response = await apiClient.post('/api/ai-search', {
        message: messageText,
        model: SELECTED_MODEL
      });
      const data = response.data;
      console.log('✅ AI Search Results:', data.results?.length || 0);

      let botText = "";

      // Generate conversational response based on results
      if (data.results && data.results.length > 0) {
        const sport = data.filters?.sport_type || "venues";
        const area = data.filters?.area;
        const date = data.filters?.date;
        const timeRange = data.filters?.time_range;

        // Count total slots
        const totalSlots = data.results.reduce((sum: number, r: any) =>
          sum + (r.available_slots?.length || 0), 0
        );

        // Build friendly response
        if (data.filters?.is_availability_check) {
          botText = `✅ Yes! I found ${data.results.length} ${sport} ${data.results.length === 1 ? 'venue' : 'venues'}`;
        } else {
          botText = `I found ${data.results.length} ${sport} ${data.results.length === 1 ? 'venue' : 'venues'}`;
        }

        // Add location context
        if (area) {
          botText += ` in ${area}`;
        }

        // Add time context
        if (timeRange?.start) {
          const startTime = timeRange.start;
          botText += ` for ${startTime}`;
        }

        // Add date context
        if (date) {
          const today = new Date().toISOString().split('T')[0];
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

          if (date === today) {
            botText += ` today`;
          } else if (date === tomorrow) {
            botText += ` tomorrow`;
          } else {
            botText += ` on ${date}`;
          }
        }

        botText += ` with ${totalSlots} available ${totalSlots === 1 ? 'slot' : 'slots'}:`;

      } else if (data.filters === null || data.filters === undefined) {
        // Non-search query (greeting, conversation, etc.)
        botText = `👋 Hi! I'm your court search assistant.\n\n🔍 I can help you find:\n• Available courts (padel, futsal, cricket, pickleball)\n• Slots by time (tonight, tomorrow, morning)\n• Courts by area (DHA, Clifton, Gulshan)\n• Cheap options\n\n💬 For general chat, please use WhatsApp!`;
      } else {
        // No results - provide helpful suggestions
        const sport = data.filters?.sport_type;
        const area = data.filters?.area;

        botText = "😔 Sorry, I couldn't find any available slots";

        if (sport && area) {
          botText += ` for ${sport} in ${area}`;
        } else if (sport) {
          botText += ` for ${sport}`;
        } else if (area) {
          botText += ` in ${area}`;
        }

        botText += ".\n\n💡 Try:\n";
        botText += "• A different area (DHA, Clifton, Gulberg)\n";
        botText += "• A different time (morning, evening, tonight)\n";
        botText += "• A different date (tomorrow, this weekend)";
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
        results: data.results || [],
        filters: data.filters,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('❌ AI Search error:', error);

      // Check if it's a non-search query (backend returns empty filters)
      if (error.response?.data?.filters === null || error.response?.data?.filters === undefined) {
        const helpMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `👋 Hi! I'm your court search assistant.\n\n🔍 I can help you find:\n• Available courts (padel, futsal, cricket, pickleball)\n• Slots by time (tonight, tomorrow, morning)\n• Courts by area (DHA, Clifton, Gulshan)\n• Cheap options\n\n💬 For general chat, please use WhatsApp!`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, helpMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `⚠️ Network Error: ${error.message || "Trouble reaching server."}\n\nCheck if backend is running at ${apiClient.defaults.baseURL}`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <RN.KeyboardAvoidingView
      behavior={RN.Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={RN.Platform.OS === 'ios' ? 90 : 0}
    >
      <RN.View style={styles.header}>
        <RN.Text style={styles.title}>AI Search Assistant</RN.Text>
        <RN.Text style={styles.subtitle}>Check availability in English or Roman Urdu</RN.Text>
      </RN.View>

      <RN.ScrollView
        style={styles.messages}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {messages.length === 0 ? (
          <RN.View style={styles.emptyState}>
            <RN.View style={styles.logoContainer}>
              <RN.View style={styles.logo}>
                <Ionicons name="sparkles" size={32} color={COLORS.textDark} />
              </RN.View>
            </RN.View>

            <RN.Text style={styles.welcomeTitle}>Advanced Search</RN.Text>
            <RN.Text style={styles.welcomeSubtitle}>
              Check slots across all venues. Try asking naturally, even in Roman Urdu!
            </RN.Text>

            <RN.View style={styles.examplesContainer}>
              <RN.Text style={styles.examplesTitle}>Try these</RN.Text>
              {examplePrompts.map((prompt, index) => (
                <RN.TouchableOpacity
                  key={index}
                  style={styles.exampleCard}
                  onPress={() => handleSend(prompt)}
                >
                  <RN.Text style={styles.exampleText}>{prompt}</RN.Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.textMuted} />
                </RN.TouchableOpacity>
              ))}
            </RN.View>
          </RN.View>
        ) : (
          messages.map((message) => (
            <RN.View
              key={message.id}
              style={[
                styles.messageRow,
                message.sender === 'user' ? styles.userRow : styles.botRow
              ]}
            >
              <RN.View style={styles.messageContent}>
                <RN.View
                  style={[
                    styles.bubble,
                    message.sender === 'user' ? styles.userBubble : styles.botBubble
                  ]}
                >
                  <RN.Text
                    style={[
                      styles.messageText,
                      message.sender === 'user' ? styles.userText : styles.botText
                    ]}
                  >
                    {message.text}
                  </RN.Text>
                </RN.View>

                {message.results && message.results.length > 0 && (
                  <RN.View style={styles.resultsContainer}>
                    {message.results.map((result: any, idx: number) => (
                      <RN.View key={`${message.id}-res-${idx}`} style={styles.resultCardWrapper}>
                        <VendorCard
                          vendor={result.vendor}
                          onPress={() => router.push(`/vendor/${result.vendor.id}`)}
                          onBookPress={() => router.push(`/vendor/${result.vendor.id}`)}
                        />

                        {/* Show available slots */}
                        {result.available_slots && result.available_slots.length > 0 && (
                          <RN.View style={styles.slotsInfo}>
                            <RN.Text style={styles.slotsTitle}>
                              Available Slots ({result.available_slots.length})
                            </RN.Text>
                            <RN.View style={styles.slotsList}>
                              {result.available_slots.slice(0, 5).map((slot: any, slotIdx: number) => (
                                <RN.View key={slotIdx} style={styles.slotChip}>
                                  <RN.Text style={styles.slotTime}>
                                    {slot.time || slot.slot_time}
                                  </RN.Text>
                                  <RN.Text style={styles.slotPrice}>
                                    Rs {slot.price}
                                  </RN.Text>
                                </RN.View>
                              ))}
                              {result.available_slots.length > 5 && (
                                <RN.Text style={styles.moreSlots}>
                                  +{result.available_slots.length - 5} more
                                </RN.Text>
                              )}
                            </RN.View>
                          </RN.View>
                        )}
                      </RN.View>
                    ))}
                  </RN.View>
                )}
              </RN.View>
            </RN.View>
          ))
        )}
      </RN.ScrollView>

      <RN.View style={styles.inputContainer}>
        <RN.View style={styles.inputWrapper}>
          <RN.TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask: 'aaj raat futsal khali hai?'"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            onSubmitEditing={() => handleSend()}
            multiline
            maxLength={200}
          />
          <RN.TouchableOpacity
            onPress={() => handleSend()}
            style={[styles.sendButton, (!input.trim() && !loading) && styles.sendButtonDisabled]}
            disabled={(!input.trim() && !loading) || loading}
          >
            {loading ? (
              <RN.ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={COLORS.background} />
            )}
          </RN.TouchableOpacity>
        </RN.View>
      </RN.View>
    </RN.KeyboardAvoidingView>
  );
}

const styles = RN.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  messages: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  emptyState: {
    paddingHorizontal: 25,
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  examplesContainer: {
    width: '100%',
  },
  examplesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exampleCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  messageRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  botRow: {
    alignItems: 'flex-start',
  },
  messageContent: {
    maxWidth: '100%',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: width * 0.85,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: COLORS.textDark,
  },
  botText: {
    color: COLORS.text,
  },
  resultsContainer: {
    marginTop: 12,
    gap: 16,
    width: width - 40,
  },
  resultCardWrapper: {
    width: '100%',
  },
  inputContainer: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  slotsInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  slotPrice: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  moreSlots: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
});
