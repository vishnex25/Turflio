import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserBookings, getFriends } from '../services/api';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({ matches: 0, friends: 0 });

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const [bookingsData, friendsData] = await Promise.all([
                getUserBookings(user.id),
                getFriends(user.id)
            ]);
            setStats({
                matches: bookingsData.length,
                friends: friendsData.length
            });
        } catch (error) {
            console.error("Error loading stats", error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="container animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
                <div style={{ width: '80px', height: '80px', background: '#e3f2fd', color: '#1565c0', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={40} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{user?.name || 'User'}</h2>
                <div style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px' }}>UID: {user?.uid || '------'}</span>
                </div>
                <p className="text-secondary">{user?.username || 'user@example.com'}</p>

                <div className="flex justify-between" style={{ marginTop: '24px', padding: '0 32px' }}>
                    <div>
                        <strong style={{ fontSize: '20px' }}>{stats.matches}</strong>
                        <p className="text-secondary text-sm">Matches</p>
                    </div>
                    <div>
                        <strong style={{ fontSize: '20px' }}>{stats.friends}</strong>
                        <p className="text-secondary text-sm">Friends</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
                <button
                    className="card flex justify-between"
                    style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => navigate('/settings')}
                >
                    <div className="flex gap-2">
                        <Settings size={20} className="text-secondary" />
                        <span>Settings</span>
                    </div>
                    <span className="text-secondary">›</span>
                </button>

                {/* Owner Dashboard Removed per request */}

                <button
                    className="card flex justify-between"
                    style={{ width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'red' }}
                    onClick={handleLogout}
                >
                    <div className="flex gap-2">
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Profile;
