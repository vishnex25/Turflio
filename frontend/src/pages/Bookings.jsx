
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserBookings, api } from '../services/api';
import { Star, X, CheckCircle } from 'lucide-react';

const RatingModal = ({ booking, onClose, onSubmit }) => {
    const [stars, setStars] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (stars === 0) { alert('Please select a star rating'); return; }
        setSubmitting(true);
        await onSubmit(booking, stars, review);
        setSubmitting(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px'
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '28px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>⭐</div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>Rate Your Experience</h3>
                    <p className="text-secondary text-sm">How was your session at <strong>{booking.turf_name}</strong>?</p>
                </div>

                {/* Star Selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <button
                            key={s}
                            onClick={() => setStars(s)}
                            onMouseEnter={() => setHovered(s)}
                            onMouseLeave={() => setHovered(0)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                transform: (hovered || stars) >= s ? 'scale(1.2)' : 'scale(1)',
                                transition: 'transform 0.15s'
                            }}
                        >
                            <Star
                                size={36}
                                fill={(hovered || stars) >= s ? '#FFC107' : 'none'}
                                color={(hovered || stars) >= s ? '#FFC107' : '#ccc'}
                            />
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <textarea
                        placeholder="Leave a review (optional)..."
                        value={review}
                        onChange={e => setReview(e.target.value)}
                        rows={3}
                        style={{
                            width: '100%', padding: '10px', borderRadius: '8px',
                            border: '1px solid #ddd', resize: 'none', fontFamily: 'inherit', fontSize: '14px'
                        }}
                    />
                </div>

                <button
                    className="btn"
                    style={{ width: '100%' }}
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    );
};

const Bookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingBooking, setRatingBooking] = useState(null);
    const [ratedSuccess, setRatedSuccess] = useState(false);

    useEffect(() => {
        if (user) fetchBookings();
    }, [user]);

    // Auto-pop rating modal for the first completed, unrated booking
    useEffect(() => {
        if (bookings.length > 0 && !ratingBooking) {
            const pending = bookings.find(b => b.is_completed && b.rating === null && b.status === 'confirmed');
            if (pending) setRatingBooking(pending);
        }
    }, [bookings]);

    const fetchBookings = async () => {
        try {
            const data = await getUserBookings(user.id);
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingSubmit = async (booking, stars, review) => {
        try {
            await api.post('/ratings', {
                user_id: user.id,
                turf_id: booking.turf_id,
                booking_id: booking.id,
                stars,
                review
            });
            setRatingBooking(null);
            setRatedSuccess(true);
            setTimeout(() => setRatedSuccess(false), 3000);
            fetchBookings(); // Refresh to update rating status
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to submit rating');
        }
    };

    if (loading) return <div className="container">Loading bookings...</div>;

    return (
        <div className="container animate-fade-in">
            <h2 style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 'bold' }}>My Bookings</h2>

            {ratedSuccess && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#e8f5e9', color: '#2e7d32', padding: '12px 16px',
                    borderRadius: '10px', marginBottom: '16px', fontWeight: '600'
                }}>
                    <CheckCircle size={18} /> Rating submitted! Thank you.
                </div>
            )}

            {bookings.length === 0 ? (
                <p className="text-secondary">No bookings found. Book a turf today!</p>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {bookings.map(booking => (
                        <div key={booking.id} className="card">
                            <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{booking.turf_name}</h3>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '8px', fontSize: '12px',
                                    background: booking.status === 'confirmed' ? '#e8f5e9' : '#ffebee',
                                    color: booking.status === 'confirmed' ? 'green' : 'red'
                                }}>
                                    {booking.status}
                                </span>
                            </div>
                            <p className="text-secondary text-sm">{booking.date} at {booking.time?.substring(0, 5)}</p>
                            <p style={{ marginTop: '8px', fontWeight: 'bold' }}>₹{booking.amount}</p>

                            {/* Rating section */}
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                                {booking.rating !== null ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={16}
                                                fill={s <= booking.rating ? '#FFC107' : 'none'}
                                                color={s <= booking.rating ? '#FFC107' : '#ccc'}
                                            />
                                        ))}
                                        <span className="text-secondary text-sm" style={{ marginLeft: '4px' }}>Your rating</span>
                                    </div>
                                ) : booking.is_completed ? (
                                    <button
                                        className="btn outline"
                                        style={{ fontSize: '13px', padding: '6px 14px' }}
                                        onClick={() => setRatingBooking(booking)}
                                    >
                                        ⭐ Rate this session
                                    </button>
                                ) : (
                                    <span className="text-secondary text-sm">Upcoming — rating available after session</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {ratingBooking && (
                <RatingModal
                    booking={ratingBooking}
                    onClose={() => setRatingBooking(null)}
                    onSubmit={handleRatingSubmit}
                />
            )}
        </div>
    );
};

export default Bookings;
