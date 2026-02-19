import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, ChevronRight, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchTurfs, api } from '../services/api';

const Home = () => {
    const [city, setCity] = useState('');
    const [turfs, setTurfs] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gameIdInput, setGameIdInput] = useState('');
    const [gameIdError, setGameIdError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadTurfs();
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            const response = await api.get('/announcements');
            setAnnouncements(response.data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadTurfs = async (queryCity = '') => {
        setLoading(true);
        try {
            const data = await searchTurfs(queryCity);
            setTurfs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadTurfs(city);
    };

    const handleJoinGame = async (e) => {
        e.preventDefault();
        const id = gameIdInput.trim();
        if (!id) { setGameIdError('Please enter a Game ID.'); return; }
        setGameIdError('');
        // Validate game exists before navigating
        try {
            await api.get(`/game/${encodeURIComponent(id)}`);
            navigate(`/join/${encodeURIComponent(id)}`);
        } catch {
            setGameIdError('Game not found. Check the ID and try again.');
        }
    };

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>Find Your Turf ⚽</h1>
                <p className="text-secondary">Book the best grounds near you</p>
            </header>

            {/* ── JOIN A GAME CARD ─────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #1a237e, #283593)',
                borderRadius: '16px', padding: '20px', marginBottom: '20px',
                color: 'white', boxShadow: '0 6px 24px rgba(26,35,126,0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Gamepad2 size={22} color="#90CAF9" />
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>Join a Split Game</h3>
                </div>
                <p style={{ fontSize: '13px', color: '#90CAF9', marginBottom: '14px' }}>
                    Got a Game ID from a friend? Enter it below to pay your share.
                </p>
                <form onSubmit={handleJoinGame} style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="Enter Game ID  e.g. kris-10AM"
                        value={gameIdInput}
                        onChange={e => { setGameIdInput(e.target.value); setGameIdError(''); }}
                        style={{
                            flex: 1, background: 'rgba(255,255,255,0.15)',
                            border: '1.5px solid rgba(255,255,255,0.3)',
                            color: 'white', borderRadius: '10px', padding: '11px 14px',
                            fontSize: '14px', fontFamily: 'monospace', fontWeight: '600',
                            outline: 'none', marginBottom: 0
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: '#4CAF50', border: 'none', borderRadius: '10px',
                            padding: '11px 16px', cursor: 'pointer', color: 'white',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontWeight: '700', fontSize: '14px', flexShrink: 0
                        }}
                    >
                        Join <ChevronRight size={16} />
                    </button>
                </form>
                {gameIdError && (
                    <p style={{ color: '#ef9a9a', fontSize: '12px', marginTop: '8px' }}>⚠️ {gameIdError}</p>
                )}
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: '#e3f2fd', border: '1px solid #bbdefb' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#0d47a1' }}>📢 Announcements</h3>
                    {announcements.map(a => (
                        <div key={a.id} style={{ fontSize: '14px', marginBottom: '4px' }}>
                            • {a.content} <span style={{ fontSize: '10px', color: '#666' }}>({a.created_at})</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search by city..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ paddingLeft: '48px' }}
                />
                <Search
                    size={20}
                    className="text-secondary"
                    style={{ position: 'absolute', left: '16px', top: '14px' }}
                />
            </form>

            {/* Turf list */}
            {loading ? (
                <p>Loading turfs...</p>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {turfs.map(turf => (
                        <div
                            key={turf.id}
                            className="card"
                            onClick={() => navigate(`/turf/${turf.id}`)}
                            style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                        >
                            <div style={{
                                height: '150px',
                                backgroundImage: `url(${turf.image_url || 'https://images.unsplash.com/photo-1529900748604-07564a03e7c3?w=500'})`,
                                backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#eee'
                            }} />
                            <div style={{ padding: '16px' }}>
                                <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{turf.name}</h3>
                                    {turf.avg_rating ? (
                                        <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                            {turf.avg_rating} ★
                                        </span>
                                    ) : (
                                        <span style={{ backgroundColor: '#f5f5f5', color: '#999', padding: '4px 8px', borderRadius: '8px', fontSize: '12px' }}>
                                            No ratings yet
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 text-secondary text-sm" style={{ marginBottom: '12px' }}>
                                    <MapPin size={14} />
                                    <span>{turf.location}, {turf.city}</span>
                                </div>
                                <div className="flex justify-between" style={{ alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>₹{turf.price}/hr</span>
                                    <button className="btn" style={{ padding: '8px 16px', fontSize: '14px' }}>Book Now</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {turfs.length === 0 && <p className="text-secondary" style={{ textAlign: 'center' }}>No turfs found.</p>}
                </div>
            )}
        </div>
    );
};

export default Home;
