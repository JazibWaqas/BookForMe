import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, StyleSheet, TouchableOpacity, TextInput,
    FlatList, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { SocialService } from '../../services/social';
import { authService, UserData } from '../../services/auth';
import { getMediaUrl } from '../../config/api';

interface CommentsModalProps {
    visible: boolean;
    postId: string;
    onClose: () => void;
    onCommentPosted?: (postId: string) => void;
}

export default function CommentsModal({ visible, postId, onClose, onCommentPosted }: CommentsModalProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);

    useEffect(() => {
        if (visible && postId) {
            loadData();
        }
    }, [visible, postId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [user, commentsData] = await Promise.all([
                authService.getCurrentUser(),
                SocialService.getComments(postId)
            ]);
            setCurrentUser(user);
            setComments(commentsData);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newComment.trim() || !currentUser) return;

        const commentText = newComment.trim();
        setSending(true);

        // Clear input immediately for better UX
        setNewComment('');
        Keyboard.dismiss();

        // Optimistic update - add comment immediately to UI
        const tempComment = {
            id: 'temp_' + Date.now(),
            content: commentText,
            created_at: new Date().toISOString(),
            author: {
                id: currentUser.id,
                name: currentUser.name || 'You',
                avatar_url: currentUser.avatar_url,
                rank: 0,
                points: 0
            }
        };
        setComments([tempComment, ...comments]);

        try {
            // Post to server
            await SocialService.createComment(postId, commentText);
            // Notify parent to update count
            if (onCommentPosted) {
                onCommentPosted(postId);
            }
            // Refresh to get actual data from server
            await loadData();
        } catch (error) {
            console.error('Error posting comment:', error);
            Alert.alert('Error', 'Failed to post comment');
            // Remove temp comment on error
            setComments(comments);
        } finally {
            setSending(false);
        }
    };

    const renderComment = ({ item }: { item: any }) => (
        <View style={styles.commentItem}>
            <Image
                source={{ uri: item.author?.avatar_url || 'https://i.pravatar.cc/150' }}
                style={styles.avatar}
            />
            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Text style={styles.authorName}>{item.author?.name || 'Unknown'}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <Text style={styles.commentText}>{item.content}</Text>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Comments</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                        }
                    />
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                >
                    <View style={styles.inputContainer}>
                        <Image
                            source={{ uri: currentUser?.avatar_url || 'https://i.pravatar.cc/150' }}
                            style={styles.inputAvatar}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Add a comment..."
                            placeholderTextColor={COLORS.textMuted}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!newComment.trim() || sending}
                            style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border
    },
    title: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    closeButton: { position: 'absolute', right: 16 },
    list: { padding: 16 },
    commentItem: { flexDirection: 'row', marginBottom: 16 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    commentContent: { flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 12 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    authorName: { fontWeight: 'bold', color: COLORS.text, fontSize: 14 },
    timestamp: { color: COLORS.textMuted, fontSize: 12 },
    commentText: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', padding: 12,
        borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.card
    },
    inputAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
    input: {
        flex: 1, backgroundColor: COLORS.background, borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, color: COLORS.text
    },
    sendButton: {
        backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center', marginLeft: 8
    },
    sendButtonDisabled: { backgroundColor: COLORS.textMuted, opacity: 0.5 }
});
