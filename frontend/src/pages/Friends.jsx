import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Check, X, Circle, MessageCircle } from 'lucide-react';
import { getFriends, getFriendRequests, searchUsers, sendFriendRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Friends = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState('all'); // 'all' | 'friends' | 'requests'
    const [sentRequests, setSentRequests] = useState(new Set());

    const loadFriends = useCallback(async () => {
        if (!user) return;
        try {
            const data = await getFriends(user.id);
            setFriends(data);
        } catch (e) { console.error(e); }
    }, [user]);

    const loadRequests = useCallback(async () => {
        if (!user) return;
        try {
            const data = await getFriendRequests(user.id);
            setRequests(data);
        } catch (e) { console.error(e); }
    }, [user]);

    const loadAllUsers = useCallback(async (q = '') => {
        if (!user) return;
        try {
            // Search with empty string returns all users (or use a broad search)
            const results = await searchUsers(q || 'a');
            // Filter out self
            setAllUsers(results.filter(u => u.id !== user.id));
        } catch (e) { console.error(e); }
    }, [user]);

    useEffect(() => {
        loadFriends();
        loadRequests();
        loadAllUsers('');
    }, [loadFriends, loadRequests, loadAllUsers]);

    const handleSearch = async (e) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (q.length > 0) {
            const results = await searchUsers(q);
            setAllUsers(results.filter(u => u.id !== user.id));
        } else {
            loadAllUsers('');
        }
    };

    const sendRequest = async (friendId) => {
        try {
            await sendFriendRequest(user.id, friendId);
            setSentRequests(prev => new Set([...prev, friendId]));
        } catch (e) {
            console.error(e);
        }
    };

    const handleResponse = async (friendId, action) => {
        if (action === 'accept') {
            await api.post('/friends/respond', { user_id: user.id, friend_id: friendId });
            loadFriends();
            loadRequests();
        } else {
            loadRequests();
        }
    };

    const friendIds = new Set(friends.map(f => f.id));

    // Displayed users for "All People" tab
    const displayedUsers = allUsers.filter(u => !friendIds.has(u.id));

    const tabs = [
        { key: 'all', label: 'All People' },
        { key: 'friends', label: `Friends${friends.length ? ` (${friends.length})` : ''}` },
        { key: 'requests', label: `Requests${requests.length ? ` (${requests.length})` : ''}` },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', background: '#f5f5f5' }}>

            {/* ── Header ── */}
            <div style={{ background: 'white', padding: '16px 16px 0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '14px' }}>Friends</h2>

                {/* Search bar */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#bbb' }} />
                    <input
                        placeholder="Search people..."
                        value={searchQuery}
                        onChange={handleSearch}
                        style={{ paddingLeft: '36px', marginBottom: 0 }}
                    />
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                flex: 1, padding: '10px 4px', border: 'none', background: 'none',
                                fontWeight: tab === t.key ? '700' : '500',
                                color: tab === t.key ? 'var(--primary-color)' : 'var(--text-secondary)',
                                borderBottom: tab === t.key ? '2px solid var(--primary-color)' : '2px solid transparent',
                                marginBottom: '-2px', cursor: 'pointer', fontSize: '13px',
                                transition: 'all 0.15s', whiteSpace: 'nowrap'
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* ALL PEOPLE tab */}
                {tab === 'all' && (
                    <div>
                        {displayedUsers.length === 0 && (
                            <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: '40px' }}>
                                {searchQuery ? 'No users found' : 'No other users yet'}
                            </p>
                        )}
                        {displayedUsers.map(u => {
                            const isSent = sentRequests.has(u.id);
                            return (
                                <div key={u.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 16px', background: 'white',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '46px', height: '46px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
                                        color: 'white', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontWeight: '700', fontSize: '18px', flexShrink: 0
                                    }}>
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{u.name}</div>
                                        {u.uid && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>UID: {u.uid}</div>}
                                    </div>
                                    <button
                                        onClick={() => !isSent && sendRequest(u.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 14px', borderRadius: '20px', border: 'none',
                                            background: isSent ? '#e8f5e9' : 'var(--primary-color)',
                                            color: isSent ? '#4CAF50' : 'white',
                                            fontWeight: '600', fontSize: '13px', cursor: isSent ? 'default' : 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isSent ? <><Check size={14} /> Sent</> : <><UserPlus size={14} /> Add</>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* FRIENDS tab */}
                {tab === 'friends' && (
                    <div>
                        {friends.length === 0 && (
                            <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                                <p className="text-secondary">No friends yet.</p>
                                <p className="text-secondary text-sm">Go to "All People" to add friends.</p>
                            </div>
                        )}
                        {friends.map(friend => (
                            <div key={friend.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', background: 'white',
                                borderBottom: '1px solid #f0f0f0'
                            }}>
                                {/* Avatar + online dot */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{
                                        width: '46px', height: '46px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #66bb6a, #2e7d32)',
                                        color: 'white', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontWeight: '700', fontSize: '18px'
                                    }}>
                                        {friend.name.charAt(0).toUpperCase()}
                                    </div>
                                    <Circle
                                        size={13}
                                        fill={friend.status === 'online' ? '#4CAF50' : '#bdbdbd'}
                                        stroke="white" strokeWidth={2}
                                        style={{ position: 'absolute', bottom: 0, right: 0 }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{friend.name}</div>
                                    <div style={{ fontSize: '12px', color: friend.status === 'online' ? '#4CAF50' : 'var(--text-secondary)' }}>
                                        {friend.status === 'online' ? '● Online' : '○ Offline'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/chat/${friend.id}`)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 14px', borderRadius: '20px', border: 'none',
                                        background: '#e3f2fd', color: '#1565c0',
                                        fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                                    }}
                                >
                                    <MessageCircle size={15} /> Chat
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* REQUESTS tab */}
                {tab === 'requests' && (
                    <div>
                        {requests.length === 0 && (
                            <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: '40px' }}>
                                No pending friend requests
                            </p>
                        )}
                        {requests.map(req => (
                            <div key={req.id} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', background: 'white',
                                borderBottom: '1px solid #f0f0f0'
                            }}>
                                <div style={{
                                    width: '46px', height: '46px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #ffa726, #e65100)',
                                    color: 'white', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontWeight: '700', fontSize: '18px', flexShrink: 0
                                }}>
                                    {req.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{req.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Wants to be friends</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleResponse(req.id, 'accept')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            padding: '8px 12px', borderRadius: '20px', border: 'none',
                                            background: '#4CAF50', color: 'white',
                                            fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                                        }}
                                    >
                                        <Check size={14} /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleResponse(req.id, 'ignore')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            padding: '8px 12px', borderRadius: '20px', border: 'none',
                                            background: '#f5f5f5', color: '#666',
                                            fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                                        }}
                                    >
                                        <X size={14} /> Ignore
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;
