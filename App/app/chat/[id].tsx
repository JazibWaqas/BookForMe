import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
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
        if (user) {
            await fetchMessages();
        } else {
            setLoading(false);
        }
    };

    const fetchMessages = useCallback(async () => {
        try {
            const history = await SocialService.getChatHistory(chatId!);
            setMessages(history);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    }, [chatId]);

    useEffect(() => {
        if (!currentUser) return;
        const intervalId = setInterval(fetchMessages, 8000);
        return () => clearInterval(intervalId);
    }, [currentUser, fetchMessages]);

    const handleImagePick = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photos.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            quality: 0.8,
        });
        if (result.canceled || !currentUser) return;

        setSending(true);
        try {
            const asset = result.assets[0];
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const storageRef = ref(storage, `chat/${chatId}/${Date.now()}_${asset.fileName || 'image.jpg'}`);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);
            const msg = await SocialService.sendMessage({
                conversation_id: chatId!,
                sender_id: currentUser.id!,
                content: null,
                media_url: url,
                media_type: 'image',
            });
            setMessages(prev => [...prev, msg]);
        } catch (e) {
            Alert.alert('Upload failed', 'Could not send the image. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !currentUser) return;

        const text = inputText.trim();
        setInputText('');
        setSending(true);
        try {
            const msg = await SocialService.sendMessage({
                conversation_id: chatId!,
                sender_id: currentUser.id!,
                content: text,
                media_type: 'text',
            });
            setMessages(prev => [...prev, msg]);
        } catch {
            setInputText(text);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === currentUser?.id;
        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                {item.media_type === 'image' && item.media_url ? (
                    <Image
                        source={{ uri: item.media_url }}
                        style={styles.messageImage}
                        resizeMode="cover"
                    />
                ) : item.content ? (
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                    </Text>
                ) : null}
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
                    <TouchableOpacity onPress={handleImagePick} disabled={sending} style={styles.imageButton}>
                        <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={COLORS.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                        style={[styles.sendButton, (!inputText.trim() || sending) && { opacity: 0.5 }]}
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
    timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', opacity: 0.7, color: 'gray' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
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
    imageButton: {
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginBottom: 4,
    },
});
