import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
    CheckCircle, Users, Clock, MapPin, Calendar,
    AlertCircle, Loader, ChevronRight, Check, ArrowLeft,
    Smartphone, CreditCard, X
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const PaymentProgress = ({ collected, total, slots, numPlayers }) => {
    const pct = Math.min(100, Math.round((collected / total) * 100));
    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Collected: <strong style={{ color: '#4CAF50' }}>₹{collected}</strong></span>
                <span style={{ color: 'var(--text-secondary)' }}>Remaining: <strong style={{ color: '#f44336' }}>₹{Math.max(0, total - collected).toFixed(2)}</strong></span>
            </div>
            <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: pct >= 100 ? '#4CAF50' : 'linear-gradient(90deg, #2196F3, #4CAF50)',
                    borderRadius: '10px', transition: 'width 0.6s ease'
                }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {slots} of {numPlayers} players paid · {pct}%
            </div>
        </div>
    );
};

const PlayerList = ({ payments, numPlayers, sharePerPlayer }) => (
    <div>
        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>
            Players ({payments.length}/{numPlayers})
        </h4>
        <div style={{ display: 'grid', gap: '8px' }}>
            {payments.map((p, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: '#f1f8e9', borderRadius: '10px',
                    border: '1px solid #c5e1a5'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: 'var(--primary-color)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '700', fontSize: '14px', flexShrink: 0
                        }}>
                            {p.player_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{p.player_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                Paid at {p.paid_at}
                                {p.upi_ref && p.upi_ref !== 'ORGANISER' && (
                                    <span style={{ marginLeft: '6px', color: '#1565c0' }}>· Ref: {p.upi_ref}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontWeight: '700', color: '#2e7d32' }}>₹{p.amount_paid}</span>
                        <Check size={16} color="#4CAF50" />
                    </div>
                </div>
            ))}
            {Array.from({ length: Math.max(0, numPlayers - payments.length) }).map((_, i) => (
                <div key={`empty-${i}`} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', background: '#fafafa', borderRadius: '10px',
                    border: '1px dashed #ddd'
                }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: '#eee', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#bbb', fontSize: '18px', flexShrink: 0
                    }}>?</div>
                    <span style={{ color: '#bbb', fontSize: '14px' }}>Waiting for player…</span>
                    <span style={{ marginLeft: 'auto', color: '#bbb', fontSize: '13px' }}>₹{sharePerPlayer}</span>
                </div>
            ))}
        </div>
    </div>
);

// Payment method options
const PAYMENT_METHODS = [
    {
        id: 'gpay',
        label: 'Google Pay',
        color: '#4285F4',
        bg: '#e8f0fe',
        emoji: '🔵',
        deepLink: (upi, amount, name) =>
            `tez://upi/pay?pa=${upi}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=TurfSplit`,
    },
    {
        id: 'phonepe',
        label: 'PhonePe',
        color: '#5f259f',
        bg: '#f3e5f5',
        emoji: '🟣',
        deepLink: (upi, amount, name) =>
            `phonepe://pay?pa=${upi}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`,
    },
    {
        id: 'paytm',
        label: 'Paytm',
        color: '#00BAF2',
        bg: '#e0f7fa',
        emoji: '🔷',
        deepLink: (upi, amount, name) =>
            `paytmmp://pay?pa=${upi}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`,
    },
    {
        id: 'bhim',
        label: 'BHIM UPI',
        color: '#FF6B00',
        bg: '#fff3e0',
        emoji: '🟠',
        deepLink: (upi, amount, name) =>
            `upi://pay?pa=${upi}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`,
    },
    {
        id: 'other',
        label: 'Other UPI App',
        color: '#607D8B',
        bg: '#f5f5f5',
        emoji: '📱',
        deepLink: (upi, amount, name) =>
            `upi://pay?pa=${upi}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main JoinGame Page
// ─────────────────────────────────────────────────────────────────────────────
const JoinGame = () => {
    const { game_id } = useParams();
    const navigate = useNavigate();

    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Multi-step payment state
    // step: 'info' | 'method' | 'confirm' | 'done'
    const [step, setStep] = useState('info');
    const [playerName, setPlayerName] = useState('');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [upiRef, setUpiRef] = useState('');
    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState('');

    const fetchGame = async () => {
        try {
            const res = await api.get(`/game/${game_id}`);
            setGame(res.data);
        } catch (e) {
            setError(e.response?.data?.error || 'Game not found. Check the link and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGame(); }, [game_id]);

    const handlePay = async () => {
        if (!upiRef.trim()) { setPayError('Please enter your UPI Transaction ID.'); return; }
        setPaying(true);
        setPayError('');
        try {
            await api.post(`/game/${game_id}/pay`, {
                player_name: playerName.trim(),
                upi_ref: upiRef.trim(),
            });
            setStep('done');
            await fetchGame();
        } catch (e) {
            setPayError(e.response?.data?.error || 'Payment failed. Please try again.');
        } finally {
            setPaying(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '16px' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <Loader size={40} color="var(--primary-color)" style={{ animation: 'spin 1s linear infinite' }} />
                <p className="text-secondary">Loading game details…</p>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="container animate-fade-in" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <AlertCircle size={56} color="#f44336" style={{ marginBottom: '16px' }} />
                <h2 style={{ marginBottom: '8px' }}>Game Not Found</h2>
                <p className="text-secondary" style={{ marginBottom: '24px' }}>{error}</p>
                <button className="btn" onClick={() => navigate('/')}>Go Home</button>
            </div>
        );
    }

    const allPaid = game.slots_filled >= game.num_players;
    const ownerUpi = game.owner_upi;
    const share = game.share_per_player;

    // ── STEP: info (main view) ───────────────────────────────────────────────
    return (
        <div className="container animate-fade-in" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: '#e3f2fd', borderRadius: '20px', padding: '6px 16px',
                    fontSize: '13px', fontWeight: '700', color: '#1565c0', marginBottom: '10px'
                }}>
                    🎮 Game ID: {game_id}
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Split Payment</h1>
                <p className="text-secondary text-sm">Organised by <strong>{game.organiser}</strong></p>
            </div>

            {/* Booking Info */}
            <div className="card" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                        { icon: <MapPin size={15} color="var(--primary-color)" />, label: 'Turf', value: game.turf_name },
                        { icon: <Calendar size={15} color="var(--primary-color)" />, label: 'Date', value: game.date },
                        { icon: <Clock size={15} color="var(--primary-color)" />, label: 'Time', value: game.time },
                        { icon: <Users size={15} color="var(--primary-color)" />, label: 'Players', value: game.num_players },
                    ].map(({ icon, label, value }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {icon}
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</div>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>{value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cost Breakdown */}
            <div className="card" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="text-secondary text-sm">Total Turf Cost</span>
                    <strong>₹{game.total_amount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="text-secondary text-sm">÷ {game.num_players} Players</span>
                    <strong>= ₹{share} each</strong>
                </div>
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    paddingTop: '10px', borderTop: '2px solid #f0f0f0'
                }}>
                    <span style={{ fontWeight: '700', fontSize: '16px' }}>Your Share</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-color)' }}>₹{share}</span>
                </div>
            </div>

            {/* Progress + Player List */}
            <div className="card" style={{ marginBottom: '14px' }}>
                <PaymentProgress
                    collected={game.amount_collected}
                    total={game.total_amount}
                    slots={game.slots_filled}
                    numPlayers={game.num_players}
                />
                <PlayerList
                    payments={game.payments}
                    numPlayers={game.num_players}
                    sharePerPlayer={share}
                />
            </div>

            {/* All Paid Banner */}
            {allPaid && (
                <div style={{
                    background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
                    border: '2px solid #4CAF50', borderRadius: '14px',
                    padding: '24px', textAlign: 'center', marginBottom: '16px'
                }}>
                    <CheckCircle size={44} color="#4CAF50" style={{ marginBottom: '10px' }} />
                    <h3 style={{ color: '#2e7d32', marginBottom: '4px' }}>All Players Paid! 🎉</h3>
                    <p className="text-secondary text-sm">The turf booking is fully confirmed.</p>
                </div>
            )}

            {/* ── PAYMENT FLOW ── */}
            {!allPaid && step === 'info' && (
                <div className="card animate-fade-in">
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>
                        💳 Pay Your Share — ₹{share}
                    </h3>
                    <input
                        type="text"
                        placeholder="Your Name *"
                        value={playerName}
                        onChange={e => setPlayerName(e.target.value)}
                        style={{ marginBottom: '14px' }}
                    />
                    <button
                        className="btn"
                        style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => {
                            if (!playerName.trim()) { setPayError('Please enter your name.'); return; }
                            setPayError('');
                            setStep('method');
                        }}
                    >
                        Continue <ChevronRight size={16} />
                    </button>
                    {payError && (
                        <div style={{ color: '#c62828', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>⚠️ {payError}</div>
                    )}
                </div>
            )}

            {/* ── STEP: Choose Payment Method ── */}
            {!allPaid && step === 'method' && (
                <div className="card animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <button onClick={() => setStep('info')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Choose Payment App</h3>
                    </div>

                    {/* Owner UPI display */}
                    {ownerUpi ? (
                        <div style={{
                            background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '10px',
                            padding: '12px 14px', marginBottom: '16px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Pay to UPI ID</div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1b5e20', letterSpacing: '0.5px' }}>{ownerUpi}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Amount: <strong>₹{share}</strong></div>
                        </div>
                    ) : (
                        <div style={{
                            background: '#fff8e1', border: '1px solid #FFD54F', borderRadius: '10px',
                            padding: '12px 14px', marginBottom: '16px', fontSize: '13px', textAlign: 'center'
                        }}>
                            ⚠️ Owner hasn't set a UPI ID yet. Ask <strong>{game.organiser}</strong> for their UPI ID and pay manually.
                        </div>
                    )}

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>
                        Select an app to pay <strong>₹{share}</strong>
                    </p>

                    <div style={{ display: 'grid', gap: '10px', marginBottom: '4px' }}>
                        {PAYMENT_METHODS.map(method => (
                            <button
                                key={method.id}
                                onClick={() => {
                                    setSelectedMethod(method);
                                    // Open deep link if UPI is available
                                    if (ownerUpi) {
                                        const link = method.deepLink(ownerUpi, share, game.organiser);
                                        window.open(link, '_blank');
                                    }
                                    setStep('confirm');
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    padding: '14px 16px', borderRadius: '12px',
                                    border: `2px solid ${method.color}20`,
                                    background: method.bg, cursor: 'pointer',
                                    transition: 'all 0.15s', textAlign: 'left'
                                }}
                            >
                                <span style={{ fontSize: '28px' }}>{method.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', color: method.color, fontSize: '15px' }}>{method.label}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {ownerUpi ? `Pay ₹${share} → ${ownerUpi}` : 'Pay manually & enter transaction ID'}
                                    </div>
                                </div>
                                <ChevronRight size={18} color={method.color} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── STEP: Enter UPI Transaction ID ── */}
            {!allPaid && step === 'confirm' && (
                <div className="card animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <button onClick={() => setStep('method')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Confirm Payment</h3>
                    </div>

                    {/* Selected method badge */}
                    {selectedMethod && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: selectedMethod.bg, border: `1px solid ${selectedMethod.color}40`,
                            borderRadius: '20px', padding: '6px 14px', marginBottom: '16px',
                            fontSize: '13px', fontWeight: '700', color: selectedMethod.color
                        }}>
                            {selectedMethod.emoji} {selectedMethod.label}
                        </div>
                    )}

                    {/* Summary */}
                    <div style={{
                        background: '#f9f9f9', borderRadius: '10px', padding: '12px 14px',
                        marginBottom: '16px', fontSize: '13px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span className="text-secondary">Player</span>
                            <strong>{playerName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span className="text-secondary">Amount</span>
                            <strong style={{ color: 'var(--primary-color)' }}>₹{share}</strong>
                        </div>
                        {ownerUpi && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-secondary">Paid to</span>
                                <strong>{ownerUpi}</strong>
                            </div>
                        )}
                    </div>

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        UPI Transaction ID *
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. 316789234567 or UPI ref number"
                        value={upiRef}
                        onChange={e => setUpiRef(e.target.value)}
                        style={{ marginBottom: '6px', fontFamily: 'monospace', letterSpacing: '0.5px' }}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Find this in your payment app under transaction history.
                    </p>

                    {payError && (
                        <div style={{
                            background: '#ffebee', color: '#c62828', borderRadius: '8px',
                            padding: '10px 14px', marginBottom: '12px', fontSize: '13px'
                        }}>
                            ⚠️ {payError}
                        </div>
                    )}

                    <button
                        className="btn"
                        style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={handlePay}
                        disabled={paying}
                    >
                        {paying ? (
                            <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Confirming…</>
                        ) : (
                            <><CheckCircle size={16} /> Confirm Payment of ₹{share}</>
                        )}
                    </button>
                </div>
            )}

            {/* ── STEP: Done ── */}
            {step === 'done' && (
                <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '28px' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(76,175,80,0.3)'
                    }}>
                        <CheckCircle size={40} color="white" />
                    </div>
                    <h3 style={{ color: '#2e7d32', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
                        Payment Confirmed! ✅
                    </h3>
                    <p className="text-secondary text-sm" style={{ marginBottom: '6px' }}>
                        ₹{share} recorded for <strong>{playerName}</strong>
                    </p>
                    <p className="text-secondary text-sm" style={{ marginBottom: '6px' }}>
                        via <strong>{selectedMethod?.label}</strong>
                    </p>
                    {upiRef && (
                        <p style={{ fontSize: '12px', color: '#1565c0', fontFamily: 'monospace', marginBottom: '20px' }}>
                            Ref: {upiRef}
                        </p>
                    )}
                    <p className="text-secondary text-sm">
                        The turf owner will verify your payment. You're all set! 🏏
                    </p>
                </div>
            )}
        </div>
    );
};

export default JoinGame;
