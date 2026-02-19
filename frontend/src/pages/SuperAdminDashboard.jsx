
import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Shield, Activity, DollarSign,
    Calendar, Megaphone, Trash2, CheckCircle, Ban, X, LogOut
} from 'lucide-react';
import {
    addOwner, deleteOwner, getAdminStats, getAllUsers,
    toggleBanUser, getAllTurfsAdmin, approveTurf, sendAnnouncement,
    api
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ users: 0, owners: 0, turfs: 0, bookings: 0, revenue: 0 });
    const [owners, setOwners] = useState([]);
    const [users, setUsers] = useState([]);
    const [turfs, setTurfs] = useState([]);

    // UI State
    const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
    const [newOwner, setNewOwner] = useState({ name: '', username: '', password: '' });
    const [announcementMsg, setAnnouncementMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'owners') fetchOwners();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'turfs') fetchTurfs();
    }, [activeTab]);

    const loadStats = async () => {
        try {
            const data = await getAdminStats();
            setStats(data || { users: 0, owners: 0, turfs: 0, bookings: 0, revenue: 0 });
        } catch (error) {
            console.error("Error loading stats:", error);
            setStats({ users: 0, owners: 0, turfs: 0, bookings: 0, revenue: 0 });
        }
    };

    const fetchOwners = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/owners');
            setOwners(res.data);
        } catch (error) {
            console.error("Error fetching owners:", error.response || error);
        } finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally { setLoading(false); }
    };

    const fetchTurfs = async () => {
        setLoading(true);
        try {
            const data = await getAllTurfsAdmin();
            setTurfs(data);
        } catch (error) {
            console.error("Error fetching turfs:", error);
        } finally { setLoading(false); }
    };

    const handleAddOwner = async (e) => {
        e.preventDefault();
        try {
            await addOwner(newOwner);
            alert('Owner added successfully');
            setShowAddOwnerModal(false);
            setNewOwner({ name: '', username: '', password: '' });
            fetchOwners();
            loadStats();
        } catch (error) {
            alert('Failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteOwner = async (id) => {
        if (!window.confirm('Are you sure? This will delete the owner account.')) return;
        try {
            await deleteOwner(id);
            fetchOwners();
            loadStats();
        } catch (error) {
            alert('Failed to delete owner');
        }
    };

    const handleToggleBan = async (id) => {
        try {
            await toggleBanUser(id);
            fetchUsers();
        } catch (error) {
            alert('Failed to update user status');
        }
    };

    const handleApproveTurf = async (id) => {
        try {
            await approveTurf(id);
            fetchTurfs();
            loadStats();
        } catch (error) {
            alert('Failed to approve turf');
        }
    };

    const handleannouncement = async (e) => {
        e.preventDefault();
        try {
            await sendAnnouncement(announcementMsg);
            alert('Announcement broadcasted!');
            setAnnouncementMsg('');
        } catch (error) {
            alert('Failed to send announcement');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="super-admin-container animate-fade-in">
            <header className="admin-header">
                <div className="admin-title">
                    <h2>Super Admin</h2>
                    <p className="admin-subtitle">System Overview & Controls</p>
                </div>
                <div className="flex gap-2">
                    <button className="icon-btn" onClick={handleLogout} title="Logout" style={{ padding: '10px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
                        <LogOut size={20} color="#666" />
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="admin-tabs">
                {['dashboard', 'owners', 'turfs', 'users', 'marketing'].map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && stats && (
                <div className="stats-grid">
                    <StatCard icon={<Users size={24} />} label="Total Users" value={stats.users || 0} />
                    <StatCard icon={<Shield size={24} />} label="Turf Owners" value={stats.owners || 0} />
                    <StatCard icon={<Calendar size={24} />} label="Total Bookings" value={stats.bookings || 0} />
                    <StatCard icon={<DollarSign size={24} />} label="Total Revenue" value={`₹${stats.revenue || 0}`} />
                    <StatCard icon={<Activity size={24} />} label="Active Turfs" value={stats.pending_turfs ? `${stats.turfs} (${stats.pending_turfs} pending)` : stats.turfs || 0} />
                </div>
            )}

            {/* OWNERS TAB */}
            {activeTab === 'owners' && (
                <div>
                    <div className="section-header">
                        <h3 className="section-title">Turf Owners</h3>
                        <button className="btn-primary-sm" onClick={() => setShowAddOwnerModal(true)}>
                            <UserPlus size={16} /> Add Owner
                        </button>
                    </div>
                    <div className="list-grid">
                        {loading ? <p>Loading...</p> : owners.map(owner => (
                            <div key={owner.id} className="list-item-card">
                                <div className="item-info">
                                    <h4>{owner.name}</h4>
                                    <p className="item-meta">ID: {owner.username}</p>
                                </div>
                                <button className="action-btn" style={{ color: '#e03131', background: '#fff5f5' }} onClick={() => handleDeleteOwner(owner.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {!loading && owners.length === 0 && <p className="text-secondary text-center">No owners found.</p>}
                    </div>
                </div>
            )}

            {/* TURFS TAB */}
            {activeTab === 'turfs' && (
                <div>
                    <div className="section-header">
                        <h3 className="section-title">Turf Management</h3>
                    </div>
                    <div className="list-grid">
                        {loading ? <p>Loading...</p> : turfs.map(turf => (
                            <div key={turf.id} className="list-item-card">
                                <div className="item-info">
                                    <h4>{turf.name}</h4>
                                    <p className="item-meta">{turf.city}</p>
                                </div>
                                <div className="flex gap-2 item-actions">
                                    <span className={`badge ${turf.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                        {turf.status.toUpperCase()}
                                    </span>
                                    {turf.status === 'pending' && (
                                        <button className="btn-primary-sm" style={{ background: '#2b8a3e' }} onClick={() => handleApproveTurf(turf.id)}>
                                            <CheckCircle size={16} /> Approve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div>
                    <div className="section-header">
                        <h3 className="section-title">User Management</h3>
                    </div>
                    <div className="list-grid">
                        {loading ? <p>Loading...</p> : users.map(user => (
                            <div key={user.id} className="list-item-card">
                                <div className="item-info">
                                    <h4>{user.name}</h4>
                                    <p className="item-meta">{user.username}</p>
                                </div>
                                <button
                                    className="btn-primary-sm"
                                    style={{ background: user.is_banned ? '#2b8a3e' : '#c92a2a' }}
                                    onClick={() => handleToggleBan(user.id)}
                                >
                                    {user.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                    <span style={{ marginLeft: 8 }}>{user.is_banned ? 'Unban' : 'Ban'}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MARKETING TAB */}
            {activeTab === 'marketing' && (
                <div className="marketing-card">
                    <h3 className="admin-title" style={{ fontSize: 20, marginBottom: 16 }}>
                        <Megaphone size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Broadcast Announcement
                    </h3>
                    <p className="admin-subtitle">Send a push notification or alert to all active users.</p>
                    <form onSubmit={handleannouncement}>
                        <textarea
                            className="marketing-textarea"
                            placeholder="Type your message here..."
                            value={announcementMsg}
                            onChange={e => setAnnouncementMsg(e.target.value)}
                            required
                        />
                        <button className="btn w-full" style={{ background: 'black', color: 'white' }}>Send Broadcast</button>
                    </form>
                </div>
            )}

            {/* ADD OWNER MODAL */}
            {showAddOwnerModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-scale-in">
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Owner</h3>
                            <button onClick={() => setShowAddOwnerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddOwner}>
                            <input
                                className="form-input"
                                placeholder="Full Name"
                                value={newOwner.name}
                                onChange={e => setNewOwner({ ...newOwner, name: e.target.value })}
                                required
                            />
                            <input
                                className="form-input"
                                placeholder="Username / ID"
                                value={newOwner.username}
                                onChange={e => setNewOwner({ ...newOwner, username: e.target.value })}
                                required
                            />
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Password"
                                value={newOwner.password}
                                onChange={e => setNewOwner({ ...newOwner, password: e.target.value })}
                                required
                            />
                            <button type="submit" className="btn w-full" style={{ background: 'black', color: 'white', marginTop: 16 }}>Create Account</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="stat-card">
        <div className="stat-icon-wrapper">
            {icon}
        </div>
        <div className="stat-content">
            <p>{label}</p>
            <h3>{value}</h3>
        </div>
    </div>
);

export default SuperAdminDashboard;
