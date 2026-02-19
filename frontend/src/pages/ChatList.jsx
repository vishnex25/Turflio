import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, CheckCheck } from 'lucide-react';
import { getFriends } from '../services/api';
import { useAuth } from '../context/AuthContext';

const avatarGradients = [
    'linear-gradient(135deg, #42a5f5, #1565c0)',
    'linear-gradient(135deg, #66bb6a, #2e7d32)',
    'linear-gradient(135deg, #ffa726, #e65100)',
    'linear-gradient(135deg, #ab47bc, #6a1b9a)',
    'linear-gradient(135deg, #26c6da, #00838f)',
    'linear-gradient(135deg, #ef5350, #b71c1c)',
    'linear-gradient(135deg, #ff7043, #bf360c)',
];

const getGradient = (name = '') => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return avatarGradients[Math.abs(h) % avatarGradients.length];
};

const ChatList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const loadFriends = useCallback(async () => {
        if (!user) return;
        try {
            const data = await getFriends(user.id);
            setFriends(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => {
        loadFriends();
        const interval = setInterval(loadFriends, 5000);
        return () => clearInterval(interval);
    }, [loadFriends]);

    const totalUnread = friends.reduce((sum, f) => sum + (f.unread_count || 0), 0);
    const filtered = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', background: '#f5f5f5' }}>

            {/* ── Header ── */}
            <div style={{ background: 'white', padding: '16px 16px 0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '14px' }}>
                    Chats
                    {totalUnread > 0 && (
                        <span style={{
                            marginLeft: '8px', background: 'var(--primary-color)', color: 'white',
                            borderRadius: '12px', padding: '2px 9px', fontSize: '12px', fontWeight: '700'
                        }}>{totalUnread}</span>
                    )}
                </h2>

                {/* Search bar */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#bbb' }} />
                    <input
                        placeholder="Search chats..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '36px', marginBottom: 0 }}
                    />
                </div>
            </div>

            {/* ── List ── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

                {loading && (
                    <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: '40px' }}>Loading…</p>
                )}

                {!loading && friends.length === 0 && (
                    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                        <p className="text-secondary">No chats yet.</p>
                        <p className="text-secondary text-sm">Add friends first to start chatting.</p>
                        <button
                            className="btn"
                            style={{ marginTop: '20px', padding: '10px 24px' }}
                            onClick={() => navigate('/friends')}
                        >
                            Find Friends
                        </button>
                    </div>
                )}

                {filtered.map(friend => {
                    const hasUnread = friend.unread_count > 0;
                    return (
                        <div
                            key={friend.id}
                            onClick={() => navigate(`/chat/${friend.id}`)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', cursor: 'pointer',
                                background: hasUnread ? '#e8f5e9' : 'white',
                                borderBottom: '1px solid #f0f0f0',
                                transition: 'background 0.15s'
                            }}
                        >
                            {/* Avatar */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={{
                                    width: '50px', height: '50px', borderRadius: '50%',
                                    background: getGradient(friend.name),
                                    color: 'white', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontWeight: '700', fontSize: '20px'
                                }}>
                                    {friend.name.charAt(0).toUpperCase()}
                                </div>
                                {/* Online dot */}
                                <div style={{
                                    position: 'absolute', bottom: '2px', right: '2px',
                                    width: '12px', height: '12px', borderRadius: '50%',
                                    background: friend.status === 'online' ? '#4CAF50' : '#bdbdbd',
                                    border: '2px solid white'
                                }} />
                            </div>

                            {/* Name + last message */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                    <span style={{
                                        fontWeight: hasUnread ? '700' : '600',
                                        fontSize: '15px',
                                        color: hasUnread ? '#1b5e20' : 'var(--text-primary)'
                                    }}>
                                        {friend.name}
                                    </span>
                                    {friend.last_message_time && (
                                        <span style={{
                                            fontSize: '11px', flexShrink: 0, marginLeft: '8px',
                                            color: hasUnread ? '#4CAF50' : 'var(--text-secondary)',
                                            fontWeight: hasUnread ? '700' : '400'
                                        }}>
                                            {friend.last_message_time}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '13px',
                                        color: hasUnread ? '#2e7d32' : 'var(--text-secondary)',
                                        fontWeight: hasUnread ? '600' : '400',
                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap', flex: 1
                                    }}>
                                        {friend.last_message ? (
                                            <>
                                                {friend.last_message_from_me && (
                                                    <CheckCheck size={13} style={{ marginRight: '3px', verticalAlign: 'middle', color: '#90CAF9' }} />
                                                )}
                                                {friend.last_message_from_me ? 'You: ' : ''}{friend.last_message}
                                            </>
                                        ) : (
                                            <span style={{ fontStyle: 'italic', color: '#ccc' }}>Say hello 👋</span>
                                        )}
                                    </span>

                                    {hasUnread && (
                                        <span style={{
                                            background: '#4CAF50', color: 'white',
                                            borderRadius: '12px', padding: '2px 8px',
                                            fontSize: '11px', fontWeight: '800',
                                            flexShrink: 0, marginLeft: '8px'
                                        }}>
                                            {friend.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {!loading && friends.length > 0 && filtered.length === 0 && (
                    <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: '30px' }}>
                        No chats match "{search}"
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatList;
