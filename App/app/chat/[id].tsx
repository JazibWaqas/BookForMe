import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL, getMediaUrl } from '../../config/api';
import { COLORS } from '../../constants/colors';
import { SocialService } from '../../services/social';
import { authService, UserData } from '../../services/auth';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const chatId = Array.isArray(id) ? id[0] : id;

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        if (user) fetchMessages();
    };

    const fetchMessages = async () => {
        try {
            const history = await SocialService.getChatHistory(chatId!);
            setMessages(history);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    };

    const handleSend = async (type: 'text' | 'image' | 'audio' = 'text', content: string | null = null, mediaUrl: string | null = null) => {
        if ((!content && !mediaUrl) || !currentUser) return;

        setSending(true);
        try {
            const msg = await SocialService.sendMessage({
                conversation_id: chatId!,
                sender_id: currentUser.id!,
                content: content || (type === 'image' ? 'Sent an image' : 'Sent audio'),
                media_url: mediaUrl || undefined,
                media_type: type
            });

            setMessages([...messages, msg]);
            setInputText('');
        } catch (error) {
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setSending(true);
            try {
                const uploadRes = await SocialService.uploadFile(result.assets[0].uri, 'chat_image');
                await handleSend('image', null, uploadRes.url);
            } catch (error) {
                Alert.alert('Error', 'Failed to upload image');
                setSending(false);
            }
        }
    };

    const recordAudio = () => {
        Alert.alert('Coming Soon', 'Audio recording is not implemented yet.');
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === currentUser?.id;

        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                {item.media_type === 'image' && item.media_url ? (
                    <Image source={{ uri: getMediaUrl(item.media_url) }} style={styles.messageImage} />
                ) : null}

                {item.content && (
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                    </Text>
                )}
                <Text style={styles.timestamp}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={10}>
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
                        <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={recordAudio} style={styles.iconButton}>
                        <Ionicons name="mic-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={COLORS.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                    />

                    <TouchableOpacity
                        onPress={() => handleSend('text', inputText)}
                        disabled={!inputText.trim() && !sending}
                        style={styles.sendButton}
                    >
                        {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messagesList: { padding: 16 },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.card,
        borderBottomLeftRadius: 4,
    },
    messageText: { fontSize: 16 },
    myMessageText: { color: '#fff' },
    theirMessageText: { color: COLORS.text },
    messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8 },
    timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', opacity: 0.7, color: 'gray' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    iconButton: { padding: 8 },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        color: COLORS.text,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
