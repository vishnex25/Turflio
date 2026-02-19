import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTurfDetails, getTurfSlots } from '../services/api';
import { Users } from 'lucide-react';

const TurfDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [turf, setTurf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [numPlayers, setNumPlayers] = useState(1);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getTurfDetails(id);
                setTurf(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    useEffect(() => {
        if (selectedDate) fetchSlots(selectedDate);
    }, [selectedDate]);

    const fetchSlots = async (date) => {
        try {
            const data = await getTurfSlots(id, date);
            setSlots(data);
            setSelectedSlot(null); // reset slot on date change
        } catch (error) {
            console.error(error);
        }
    };

    const handleBooking = () => {
        if (selectedDate && selectedSlot) {
            navigate('/booking/confirm', {
                state: { turf, date: selectedDate, slot: selectedSlot, num_players: numPlayers }
            });
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!turf) return <div className="container">Turf not found</div>;

    const totalPrice = parseFloat(turf.price);
    const sharePerPlayer = numPlayers > 1 ? (totalPrice / numPlayers).toFixed(2) : null;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            {/* Hero image */}
            <div style={{
                height: '250px',
                backgroundImage: turf.image_url ? `url(${turf.image_url})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                position: 'relative', backgroundColor: '#c8e6c9'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        position: 'absolute', top: '16px', left: '16px',
                        background: 'rgba(255,255,255,0.9)', border: 'none',
                        borderRadius: '50%', width: '38px', height: '38px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                >←</button>
            </div>

            <div className="container" style={{ marginTop: '-20px', background: 'white', borderRadius: '24px 24px 0 0', position: 'relative', padding: '24px' }}>
                {/* Turf header */}
                <div className="flex justify-between" style={{ alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>{turf.name}</h1>
                        <p className="text-secondary text-sm">{turf.location}, {turf.city}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-color)' }}>₹{turf.price}</span>
                        <p className="text-secondary" style={{ fontSize: '11px' }}>per hour</p>
                    </div>
                </div>

                {/* Amenities */}
                {turf.amenities?.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>Amenities</h3>
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            {turf.amenities.map((amenity, index) => (
                                <span key={index} style={{
                                    background: '#f0f4ff', color: '#3949ab',
                                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                                }}>
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Date & Slot selection */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Select Date &amp; Time</h3>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        style={{ marginBottom: '16px' }}
                    />

                    {selectedDate && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {slots.map(slot => (
                                <button
                                    key={slot.id}
                                    disabled={!slot.available}
                                    onClick={() => setSelectedSlot(slot)}
                                    style={{
                                        padding: '12px 8px',
                                        border: `2px solid ${selectedSlot?.id === slot.id ? 'var(--primary-color)' : '#eee'}`,
                                        borderRadius: '12px',
                                        background: selectedSlot?.id === slot.id ? '#e8f5e9' : (slot.available ? 'white' : '#f9f9f9'),
                                        color: slot.available ? (selectedSlot?.id === slot.id ? '#2e7d32' : '#333') : '#bbb',
                                        cursor: slot.available ? 'pointer' : 'not-allowed',
                                        fontWeight: selectedSlot?.id === slot.id ? '700' : '500',
                                        fontSize: '13px',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {slot.time}
                                    {!slot.available && <span style={{ display: 'block', fontSize: '10px', color: '#ef9a9a', marginTop: '2px' }}>Booked</span>}
                                </button>
                            ))}
                            {slots.length === 0 && <p className="text-secondary text-sm" style={{ gridColumn: '1/-1' }}>Loading slots...</p>}
                        </div>
                    )}
                </div>

                {/* Number of Players — shown after slot is selected */}
                {selectedSlot && (
                    <div style={{ marginBottom: '24px' }} className="animate-fade-in">
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} color="var(--primary-color)" /> Number of Players
                        </h3>
                        <p className="text-secondary text-sm" style={{ marginBottom: '12px' }}>
                            How many players will split the cost?
                        </p>

                        {/* Quick-select buttons */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            {[1, 2, 5, 7, 11].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setNumPlayers(n)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '20px', border: '2px solid',
                                        borderColor: numPlayers === n ? 'var(--primary-color)' : '#ddd',
                                        background: numPlayers === n ? '#e8f5e9' : 'white',
                                        color: numPlayers === n ? '#2e7d32' : '#555',
                                        fontWeight: numPlayers === n ? '700' : '500',
                                        cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s'
                                    }}
                                >
                                    {n === 1 ? 'Just me' : `${n}`}
                                </button>
                            ))}
                        </div>

                        {/* Custom input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                                type="number"
                                value={numPlayers}
                                onChange={(e) => setNumPlayers(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                max="50"
                                style={{ width: '90px', marginBottom: 0, textAlign: 'center', fontWeight: '700', fontSize: '18px' }}
                            />
                            {numPlayers > 1 && (
                                <div style={{
                                    flex: 1, background: '#e8f5e9', borderRadius: '10px',
                                    padding: '10px 14px', fontSize: '13px', color: '#2e7d32', fontWeight: '600'
                                }}>
                                    💰 ₹{(totalPrice / numPlayers).toFixed(2)} per player
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Proceed button */}
                <button
                    className="btn"
                    style={{ width: '100%', padding: '15px', fontSize: '16px', opacity: (!selectedDate || !selectedSlot) ? 0.5 : 1 }}
                    disabled={!selectedDate || !selectedSlot}
                    onClick={handleBooking}
                >
                    {selectedSlot
                        ? `Proceed · ₹${totalPrice}${numPlayers > 1 ? ` (₹${(totalPrice / numPlayers).toFixed(2)}/player)` : ''}`
                        : 'Select a Slot to Continue'}
                </button>
            </div>
        </div>
    );
};

export default TurfDetails;
