
import axios from 'axios';

// ✅ Cloud backend - works whether PC is on or off
// After deploying to Railway, replace the URL below with your actual Railway URL
// Example: 'https://turf-backend-production.up.railway.app/api'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: API_URL,
});

// Auth
export const loginUser = async (credentials) => {
    try {
        const response = await api.post('/login', credentials);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const logoutUser = async (userId) => {
    await api.post('/logout', { user_id: userId });
};

export const signupUser = async (userData) => {
    try {
        const response = await api.post('/signup', userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const addOwner = async (ownerData) => {
    try {
        const response = await api.post('/admin/add-owner', ownerData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteOwner = async (id) => {
    const response = await api.delete(`/admin/owners/${id}`);
    return response.data;
};

export const getAdminStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const toggleBanUser = async (id) => {
    const response = await api.post(`/admin/users/${id}/ban`);
    return response.data;
};

export const getAllTurfsAdmin = async () => {
    const response = await api.get('/admin/turfs');
    return response.data;
};

export const approveTurf = async (id) => {
    const response = await api.post(`/admin/turfs/${id}/approve`);
    return response.data;
};

export const sendAnnouncement = async (message) => {
    const response = await api.post('/admin/announce', { message });
    return response.data;
};

// Turfs
export const searchTurfs = async (city) => {
    try {
        const response = await api.get(`/turfs?city=${city || ''}`);
        return response.data;
    } catch (error) {
        console.error('Error searching turfs:', error);
        return [];
    }
};

export const getTurfDetails = async (id) => {
    const response = await api.get(`/turfs/${id}`);
    return response.data;
};

export const getTurfSlots = async (id, date) => {
    const response = await api.get(`/turfs/${id}/slots?date=${date}`);
    return response.data;
};

export const bookTurf = async (bookingData) => {
    const response = await api.post('/book', bookingData);
    return response.data;
};

// User Data
export const getUserBookings = async (userId) => {
    const response = await api.get(`/users/${userId}/bookings`);
    return response.data;
};

export const getFriends = async (userId) => {
    const response = await api.get(`/users/${userId}/friends`);
    return response.data;
};

export const getFriendRequests = async (userId) => {
    const response = await api.get(`/users/${userId}/requests`);
    return response.data;
};

export const searchUsers = async (query) => {
    const response = await api.get(`/users/search?q=${query}`);
    return response.data;
};

export const sendFriendRequest = async (userId, friendId) => {
    const response = await api.post('/friends/request', { user_id: userId, friend_id: friendId });
    return response.data;
};

// Messages
export const getMessages = async (userId, friendId) => {
    const response = await api.get(`/messages?user_id=${userId}&friend_id=${friendId}`);
    return response.data;
};

export const sendMessage = async (userId, friendId, text) => {
    const response = await api.post('/messages', { user_id: userId, friend_id: friendId, text });
    return response.data;
};

// User Profile Public
export const getUser = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

// Split Payment / Game
export const getGameDetails = async (gameId) => {
    const response = await api.get(`/game/${encodeURIComponent(gameId)}`);
    return response.data;
};

export const payGameShare = async (gameId, playerName, upiRef, playerId) => {
    const response = await api.post(`/game/${encodeURIComponent(gameId)}/pay`, {
        player_name: playerName,
        upi_ref: upiRef,
        player_id: playerId || null
    });
    return response.data;
};
