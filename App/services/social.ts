import { apiClient } from '../config/api';

// Types (matching Backend)
export interface UserProfileSocial {
    id: string;
    name: string;
    avatar_url?: string;
    rank: number;
    points: number;
}

export interface Post {
    id: string;
    user_id: string;
    type: 'general' | 'looking_for_players' | 'tip' | 'question';
    content: string;
    sport_type?: string;
    location?: string;
    image_url?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author?: UserProfileSocial;
    likes?: string[]; // user_ids
    liked?: boolean; // Frontend helper
}

export interface Match {
    id: string;
    host_user_id: string;
    sport_type: string;
    match_type: 'casual' | 'ranked';
    date: string;
    time: string;
    location: string;
    venue_id?: string;
    max_players: number;
    description?: string;
    status: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
    current_players: number;
    participants: UserProfileSocial[];
}

// Service
export const SocialService = {
    // --- Upload ---
    async uploadFile(fileUri: string, type: 'post' | 'chat_image' | 'chat_audio' = 'post') {
        const formData = new FormData();
        // Need to infer filename and type
        const filename = fileUri.split('/').pop() || `upload_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : 'jpg';

        // FormData expects an object with uri, name, type for React Native
        formData.append('file', {
            uri: fileUri,
            name: filename,
            type: type === 'chat_audio' ? 'audio/m4a' : `image/${ext}`
        } as any);

        formData.append('type', type);

        const response = await apiClient.post('/api/social/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // { url: ..., type: ... }
    },

    // --- Posts ---
    async createPost(data: { content?: string; type?: string; sport_type?: string; location?: string; image_url?: string; audio_url?: string; }) {
        // Ideally user_id comes from token in backend, but our API schema requires it for now if not inferred
        // We'll rely on backend to extract from token or we might need to pass it if backend requires
        // Looking at backend code: create_post(post: PostCreate). PostCreate needs user_id.
        // In a real app we'd get this from auth context. For now we assume the caller passes or we get from storage.
        // Let's assume the component handles getting the user ID.
        const response = await apiClient.post('/api/social/posts/create', data);
        return response.data;
    },

    async getFeed(limit = 20, type = 'all', mediaOnly = false) {
        const response = await apiClient.get('/api/social/posts/feed', {
            params: { limit, type, media_only: mediaOnly }
        });
        return response.data;
    },

    async toggleLike(postId: string, userId: string) {
        const response = await apiClient.post(`/api/social/posts/${postId}/like`, null, {
            params: { user_id: userId }
        });
        return response.data;
    },

    // --- Matches ---
    async createMatch(data: any) {
        const response = await apiClient.post('/api/social/matches/create', data);
        return response.data;
    },

    async getMatches(sport: string = 'all', search: string = '') {
        const response = await apiClient.get('/api/social/matches/list', {
            params: { sport, search }
        });
        return response.data;
    },

    async joinMatch(matchId: string, userId: string) {
        const response = await apiClient.post(`/api/social/matches/${matchId}/join`, null, {
            params: { user_id: userId }
        });
        return response.data;
    },

    // --- Chat ---
    async getConversations(userId: string) {
        const response = await apiClient.get('/api/social/chat/conversations', {
            params: { user_id: userId }
        });
        return response.data;
    },

    async getChatHistory(conversationId: string) {
        const response = await apiClient.get(`/api/social/chat/history/${conversationId}`);
        return response.data;
    },

    async sendMessage(data: { conversation_id?: string; sender_id: string; receiver_id?: string; content?: string; media_url?: string; media_type?: string }) {
        const response = await apiClient.post('/api/social/chat/message', data);
        return response.data;
    },

    // --- Leaderboard ---
    async getLeaderboard(limit = 50) {
        const response = await apiClient.get('/api/social/leaderboard', { params: { limit } });
        return response.data;
    },

    // --- Notifications ---
    async getNotifications(userId: string) {
        // In real app, we might need a separate notifications endpoint or filters
        // Currently assuming a new endpoint '/api/social/notifications' exists
        const response = await apiClient.get('/api/social/notifications', {
            params: { user_id: userId }
        });
        return response.data;
    },

    async getComments(postId: string) {
        const response = await apiClient.get(`/api/social/posts/${postId}/comments`);
        return response.data;
    },

    async createComment(postId: string, content: string) {
        const response = await apiClient.post(`/api/social/posts/${postId}/comments`, { content });
        return response.data;
    }
};
