import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Share2, Copy, Check, CheckCircle, Users, Wallet, ArrowRight } from 'lucide-react';
import { bookTurf } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Game Created success screen ──────────────────────────────────────────────
const GameCreatedScreen = ({ gameId, navigate, turf, date, slot, numPlayers, advancePaid, sharePerPlayer }) => {
    const [copied, setCopied] = useState(false);

    const shareUrl = `${window.location.origin}/join/${encodeURIComponent(gameId)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(gameId);
        } catch {
            const el = document.createElement('textarea');
            el.value = gameId;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareLink = async () => {
        const shareData = {
            title: '🏏 Join my Turf Game!',
            text: `Hey! Join my turf booking at ${turf?.name} on ${date} at ${slot?.time}.\nUse Game ID: ${gameId}\nYour share: ₹${sharePerPlayer}`,
            url: shareUrl,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (_) { }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
                alert('Share message copied to clipboard!\n\n' + shareData.text + '\n' + shareUrl);
            } catch {
                alert('Share this link:\n\n' + shareUrl);
            }
        }
    };

    return (
        <div className="container animate-fade-in" style={{ textAlign: 'center', paddingTop: '32px' }}>
            {/* Success Icon */}
            <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #4CAF50, #81C784)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(76,175,80,0.35)'
            }}>
                <CheckCircle size={44} color="white" />
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px' }}>Game Created! 🎉</h2>
            <p className="text-secondary" style={{ marginBottom: '28px', fontSize: '14px' }}>
                Share the Game ID with your friends to split the payment.
            </p>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div className="card" style={{ textAlign: 'center', padding: '16px', marginBottom: 0 }}>
                    <Users size={20} color="var(--primary-color)" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-color)' }}>{numPlayers}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Players</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '16px', marginBottom: 0 }}>
                    <Wallet size={20} color="#2196F3" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#2196F3' }}>₹{sharePerPlayer}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Per Player</div>
                </div>
            </div>

            {/* How it works */}
            <div style={{
                background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: '12px',
                padding: '14px 16px', marginBottom: '20px', textAlign: 'left'
            }}>
                <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: '#6a1b9a' }}>📋 How friends pay their share:</div>
                {[
                    { n: '1', text: 'Share the Game ID or link below with your friends' },
                    { n: '2', text: 'Friends open the link → enter their name → choose GPay / PhonePe / Paytm' },
                    { n: '3', text: 'They pay their share and enter the UPI transaction ID to confirm' },
                ].map(({ n, text }) => (
                    <div key={n} style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{
                            width: '22px', height: '22px', borderRadius: '50%', background: '#9c27b0',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', fontSize: '11px', flexShrink: 0
                        }}>{n}</span>
                        <span style={{ color: '#4a148c', lineHeight: '1.4' }}>{text}</span>
                    </div>
                ))}
            </div>

            {/* Game ID card */}
            <div className="card" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
                border: '2px dashed #2196F3', marginBottom: '12px'
            }}>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>GAME ID — share this with friends</div>
                    <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '1px', color: '#1a237e' }}>
                        {gameId}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    title={copied ? 'Copied!' : 'Copy Game ID'}
                    style={{
                        background: copied ? '#e8f5e9' : '#e3f2fd',
                        border: 'none', cursor: 'pointer',
                        color: copied ? '#4CAF50' : '#2196F3',
                        borderRadius: '10px', padding: '10px',
                        transition: 'all 0.2s', flexShrink: 0
                    }}
                >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
            </div>

            {/* Open Payment Page — for organiser to track */}
            <button
                className="btn"
                style={{ width: '100%', marginBottom: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
                onClick={() => navigate(`/join/${encodeURIComponent(gameId)}`)}
            >
                <ArrowRight size={18} /> Open Payment Page
            </button>

            {/* Share Link button */}
            <button
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px' }}
                onClick={handleShareLink}
            >
                <Share2 size={18} /> Share Link with Friends
            </button>

            {/* View Bookings */}
            <button
                style={{
                    width: '100%', padding: '13px', background: 'transparent',
                    color: 'var(--text-primary)', border: '1px solid #ddd',
                    borderRadius: '12px', cursor: 'pointer', fontWeight: '600',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
                onClick={() => navigate('/bookings')}
            >
                View My Bookings <ArrowRight size={16} />
            </button>
        </div>
    );
};

// ── Main Booking Confirm page ────────────────────────────────────────────────
const BookingConfirm = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState('full');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [gameId, setGameId] = useState(null);
    const [advancePaid, setAdvancePaid] = useState(0);
    const [sharePerPlayer, setSharePerPlayer] = useState(0);
    const [loading, setLoading] = useState(false);

    if (!state) return <div className="container">No booking details found.</div>;
    const { turf, date, slot, num_players } = state;
    const numPlayers = num_players || 1;
    const totalPrice = parseFloat(turf.price);
    const calculatedShare = +(totalPrice / numPlayers).toFixed(2);
    const advanceAmount = +(totalPrice * 0.20).toFixed(2);

    const handlePayment = async () => {
        setLoading(true);
        const bookingData = {
            user_id: user.id,
            turf_id: turf.id,
            date: date,
            start_time: slot.start_raw,
            amount: totalPrice,
            num_players: numPlayers,
            type: paymentMethod === 'split' ? 'split' : 'online',
        };

        try {
            const result = await bookTurf(bookingData);
            if (paymentMethod === 'split') {
                setGameId(result.game_id);
                setAdvancePaid(result.advance_paid || advanceAmount);
                setSharePerPlayer(result.share_per_player || calculatedShare);
                setBookingSuccess(true);
            } else {
                alert('✅ Payment Successful! Booking confirmed.');
                navigate('/bookings');
            }
        } catch (error) {
            alert('Booking failed: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    if (bookingSuccess && gameId) {
        return (
            <GameCreatedScreen
                gameId={gameId}
                navigate={navigate}
                turf={turf}
                date={date}
                slot={slot}
                numPlayers={numPlayers}
                advancePaid={advancePaid}
                sharePerPlayer={sharePerPlayer}
            />
        );
    }

    return (
        <div className="container animate-fade-in">
            <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: '800' }}>Confirm Booking</h2>

            {/* Booking summary card */}
            <div className="card">
                <h3 style={{ marginBottom: '4px', fontSize: '18px' }}>{turf.name}</h3>
                <p className="text-secondary text-sm" style={{ marginBottom: '16px' }}>{turf.location}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f0f0f0' }}>
                    <span className="text-secondary">Date</span>
                    <strong>{date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f0f0f0' }}>
                    <span className="text-secondary">Time</span>
                    <strong>{slot.time}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f0f0f0' }}>
                    <span className="text-secondary">Players</span>
                    <strong>{numPlayers} player{numPlayers > 1 ? 's' : ''}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #f0f0f0', fontSize: '18px' }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--primary-color)', fontWeight: '800' }}>₹{totalPrice}</span>
                </div>
                {numPlayers > 1 && (
                    <div style={{
                        background: '#e8f5e9', borderRadius: '10px', padding: '10px 14px',
                        fontSize: '13px', color: '#2e7d32', fontWeight: '600'
                    }}>
                        💡 Split: ₹{calculatedShare} per player
                    </div>
                )}
            </div>

            {/* Payment Option */}
            <h3 style={{ marginBottom: '14px', fontSize: '16px', fontWeight: '700' }}>Payment Option</h3>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                {/* Full Payment */}
                <label className="card" style={{
                    display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '16px',
                    border: paymentMethod === 'full' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    marginBottom: 0, transition: 'border 0.2s'
                }}>
                    <input type="radio" name="payment" value="full"
                        checked={paymentMethod === 'full'}
                        onChange={() => setPaymentMethod('full')}
                        style={{ width: 'auto', marginRight: '12px', marginBottom: 0 }}
                    />
                    <div>
                        <strong>Pay Full Amount</strong>
                        <p className="text-secondary text-sm">Pay ₹{totalPrice} now — booking confirmed instantly</p>
                    </div>
                </label>

                {/* Split Payment */}
                <label className="card" style={{
                    display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '16px',
                    border: paymentMethod === 'split' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    marginBottom: 0, transition: 'border 0.2s'
                }}>
                    <input type="radio" name="payment" value="split"
                        checked={paymentMethod === 'split'}
                        onChange={() => setPaymentMethod('split')}
                        style={{ width: 'auto', marginRight: '12px', marginBottom: 0 }}
                    />
                    <div>
                        <strong>Split with Friends</strong>
                        <p className="text-secondary text-sm">
                            Pay ₹{advanceAmount} advance (20%) now · friends pay ₹{calculatedShare} each
                        </p>
                    </div>
                </label>
            </div>

            <button
                className="btn"
                style={{ width: '100%', padding: '15px', fontSize: '16px' }}
                onClick={handlePayment}
                disabled={loading}
            >
                {loading ? 'Processing...' : (paymentMethod === 'split' ? `Pay ₹${advanceAmount} Advance & Create Game` : `Pay ₹${totalPrice} Now`)}
            </button>
        </div>
    );
};

export default BookingConfirm;
