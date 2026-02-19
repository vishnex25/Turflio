import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Check } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMessages, sendMessage, getUser } from '../services/api';

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

// ── Read Receipt Tick Component ───────────────────────────────────────────────
// sending (temp) → single grey tick
// sent (not read) → double grey tick
// read → double blue tick
const ReadTick = ({ isTemp, isRead }) => {
    if (isTemp) {
        // Single grey tick — still sending
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '3px' }}>
                <Check size={11} strokeWidth={2.5} color="rgba(255,255,255,0.45)" />
            </span>
        );
    }
    if (!isRead) {
        // Double grey tick — delivered but not seen
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '3px', position: 'relative', width: '16px', height: '12px' }}>
                <Check size={11} strokeWidth={2.5} color="rgba(255,255,255,0.5)"
                    style={{ position: 'absolute', left: 0 }} />
                <Check size={11} strokeWidth={2.5} color="rgba(255,255,255,0.5)"
                    style={{ position: 'absolute', left: '5px' }} />
            </span>
        );
    }
    // Double BLUE tick — seen ✓✓
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '3px', position: 'relative', width: '16px', height: '12px' }}>
            <Check size={11} strokeWidth={2.5} color="#4FC3F7"
                style={{ position: 'absolute', left: 0 }} />
            <Check size={11} strokeWidth={2.5} color="#4FC3F7"
                style={{ position: 'absolute', left: '5px' }} />
        </span>
    );
};

const Chat = () => {
    const { user } = useAuth();
    const { friendId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [friend, setFriend] = useState(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadFriend = useCallback(async () => {
        try { setFriend(await getUser(friendId)); }
        catch (e) { console.error(e); }
    }, [friendId]);

    const loadMessages = useCallback(async () => {
        try {
            if (!friendId || !user) return;
            const data = await getMessages(user.id, friendId);
            // Backend auto-marks messages as read when fetched
            setMessages(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
        } catch (e) { console.error(e); }
    }, [friendId, user]);

    useEffect(() => {
        if (!friendId) { navigate('/chat'); return; }
        loadFriend();
        loadMessages();
        // Poll every 3s — this also auto-marks incoming as read each time
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, [friendId, loadFriend, loadMessages, navigate]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;
        setSending(true);
        const text = input.trim();
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: tempId,
            sender_id: user.id,
            text,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            sender: user.name,
            is_read: false,
            _temp: true
        }]);
        setInput('');
        try {
            await sendMessage(user.id, friendId, text);
            await loadMessages();
        } catch (e) { console.error(e); }
        finally { setSending(false); inputRef.current?.focus(); }
    };

    const friendGradient = getGradient(friend?.name || '');

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 70px)',
            background: '#f5f5f5',
            fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
            <style>{`
                @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                .msg-bubble { animation: msgIn 0.18s ease; }
                .send-btn:hover:not(:disabled) { filter: brightness(1.1); transform: scale(1.05); }
                .send-btn:active:not(:disabled) { transform: scale(0.95); }
                .chat-input:focus { outline: none; }
            `}</style>

            {/* ── Header ── */}
            <div style={{
                background: 'white', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <button
                    onClick={() => navigate('/chat')}
                    style={{
                        background: '#f5f5f5', border: 'none', borderRadius: '50%',
                        width: '36px', height: '36px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-primary)', flexShrink: 0
                    }}
                >
                    <ArrowLeft size={18} />
                </button>

                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: friendGradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '700', fontSize: '17px', color: 'white'
                    }}>
                        {friend?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{
                        position: 'absolute', bottom: '1px', right: '1px',
                        width: '11px', height: '11px', borderRadius: '50%',
                        background: friend?.is_online ? '#4CAF50' : '#bdbdbd',
                        border: '2px solid white'
                    }} />
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {friend?.name || 'Chat'}
                    </div>
                    <div style={{ fontSize: '12px', color: friend?.is_online ? '#4CAF50' : 'var(--text-secondary)' }}>
                        {friend?.is_online ? '● Online' : '○ Offline'}
                    </div>
                </div>
            </div>

            {/* ── Messages ── */}
            <div style={{
                flex: 1, overflowY: 'auto',
                padding: '12px 12px 8px',
                display: 'flex', flexDirection: 'column', gap: '3px'
            }}>
                {messages.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '40px' }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: friendGradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', fontSize: '28px', color: 'white',
                            marginBottom: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                        }}>
                            {friend?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <p style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {friend?.name}
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Say hello 👋</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    const isTemp = !!msg._temp;
                    const nextMsg = messages[idx + 1];
                    const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                    return (
                        <div
                            key={msg.id}
                            className="msg-bubble"
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '75%',
                                marginBottom: isLastInGroup ? '6px' : '1px',
                                display: 'flex',
                                flexDirection: isMe ? 'row-reverse' : 'row',
                                alignItems: 'flex-end',
                                gap: '6px'
                            }}
                        >
                            {/* Friend avatar — only on last bubble in group */}
                            {!isMe && (
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: isLastInGroup ? friendGradient : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: '700', fontSize: '11px', color: 'white', flexShrink: 0
                                }}>
                                    {isLastInGroup ? friend?.name?.charAt(0)?.toUpperCase() : ''}
                                </div>
                            )}

                            {/* Bubble */}
                            <div style={{
                                padding: '9px 13px',
                                borderRadius: isMe
                                    ? (isLastInGroup ? '18px 18px 4px 18px' : '18px')
                                    : (isLastInGroup ? '18px 18px 18px 4px' : '18px'),
                                background: isMe ? 'var(--primary-color)' : 'white',
                                boxShadow: isMe
                                    ? '0 2px 8px rgba(76,175,80,0.25)'
                                    : '0 1px 4px rgba(0,0,0,0.08)',
                                opacity: isTemp ? 0.75 : 1,
                                transition: 'opacity 0.2s'
                            }}>
                                <p style={{
                                    fontSize: '14px', lineHeight: '1.45',
                                    color: isMe ? 'white' : 'var(--text-primary)',
                                    margin: 0, wordBreak: 'break-word'
                                }}>
                                    {msg.text}
                                </p>

                                {/* Timestamp + read receipt */}
                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'flex-end', gap: '2px', marginTop: '3px'
                                }}>
                                    <span style={{
                                        fontSize: '10px',
                                        color: isMe ? 'rgba(255,255,255,0.65)' : 'var(--text-secondary)'
                                    }}>
                                        {msg.time}
                                    </span>
                                    {/* Only show ticks on MY messages */}
                                    {isMe && (
                                        <ReadTick isTemp={isTemp} isRead={msg.is_read} />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Bar ── */}
            <div style={{
                background: 'white', borderTop: '1px solid #f0f0f0', padding: '10px 12px'
            }}>
                <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        flex: 1, background: '#f5f5f5', borderRadius: '24px', padding: '10px 16px',
                        display: 'flex', alignItems: 'center',
                        border: `1.5px solid ${input ? 'var(--primary-color)' : 'transparent'}`,
                        transition: 'border-color 0.2s'
                    }}>
                        <input
                            ref={inputRef}
                            className="chat-input"
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                            style={{
                                border: 'none', background: 'none', width: '100%',
                                fontSize: '14px', color: 'var(--text-primary)',
                                outline: 'none', padding: 0, marginBottom: 0
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="send-btn"
                        disabled={!input.trim() || sending}
                        style={{
                            width: '44px', height: '44px', borderRadius: '50%',
                            border: 'none', flexShrink: 0,
                            background: input.trim() ? 'var(--primary-color)' : '#e0e0e0',
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: input.trim() ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            boxShadow: input.trim() ? '0 2px 8px rgba(76,175,80,0.35)' : 'none'
                        }}
                    >
                        <Send size={18} style={{ marginLeft: '2px' }} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
