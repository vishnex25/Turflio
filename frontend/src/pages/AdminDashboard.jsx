
import React, { useState, useEffect } from 'react';
import { Shield, Plus, LogOut, LayoutDashboard, Calendar, DollarSign, Wrench, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, bookTurf } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [myTurfs, setMyTurfs] = useState([]);
    const [loading, setLoading] = useState(true);

    // For manual booking
    const [newBooking, setNewBooking] = useState({ date: '', time: '', start_time: '', turf_id: '' });
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [myBookings, setMyBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Add Turf State
    const [newTurf, setNewTurf] = useState({
        name: '',
        sport_type: 'Cricket',
        city: '',
        location: '',
        amenities: '',
        price: '',
        image: null
    });

    // Edit Turf State
    const [editingTurf, setEditingTurf] = useState(null); // holds turf being edited
    const [editForm, setEditForm] = useState({});
    const [editImage, setEditImage] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    // Derived Stats
    const totalRevenue = myBookings.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalBookings = myBookings.length;
    const upcomingBookings = myBookings.filter(b => new Date(b.date) >= new Date());

    useEffect(() => {
        if (user) {
            fetchMyData();
        }
    }, [user]);

    const fetchMyData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, turfsRes] = await Promise.all([
                api.get(`/owner/bookings?user_id=${user.id}`),
                api.get(`/owner/turfs?user_id=${user.id}`)
            ]);
            setMyBookings(bookingsRes.data);
            setMyTurfs(turfsRes.data);

            // Set default turf if available
            if (turfsRes.data.length > 0) {
                setNewBooking(prev => ({ ...prev, turf_id: turfsRes.data[0].id }));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAddOfflineBooking = async (e) => {
        e.preventDefault();
        if (!newBooking.turf_id) {
            alert("Please select a turf");
            return;
        }

        try {
            await bookTurf({
                user_id: user.id,
                turf_id: newBooking.turf_id,
                date: newBooking.date,
                start_time: newBooking.start_time + ":00", // e.g. 18:00:00
                amount: isMaintenance ? 0 : 0, // Offline/Maintenance is 0 for now (or could be custom price)
                type: 'offline', // Using offline for both, distinction will be visual
            });
            alert(isMaintenance ? 'Maintenance block added!' : 'Offline booking added!');
            setNewBooking({ date: '', time: '', start_time: '', turf_id: '' }); // Reset
            setIsMaintenance(false);
            fetchMyData(); // Reload list
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.error || e.message));
        }
    };

    const handleAddTurf = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('owner_id', user.id);
        formData.append('name', newTurf.name);
        formData.append('sport_type', newTurf.sport_type);
        formData.append('city', newTurf.city);
        formData.append('location', newTurf.location);
        formData.append('amenities', newTurf.amenities);
        formData.append('price', newTurf.price);
        if (newTurf.image) formData.append('image', newTurf.image);

        try {
            await api.post('/turfs/add', formData);
            alert('Turf added successfully!');
            setNewTurf({ name: '', sport_type: 'Cricket', city: '', location: '', amenities: '', price: '', image: null });
            fetchMyData();
            setActiveTab('my-turfs');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || 'Failed to add turf';
            alert(msg);
            if (msg.includes('logout') || error.response?.status === 401) {
                logout();
                navigate('/login');
            }
        }
    };

    const openEditModal = (turf) => {
        setEditingTurf(turf);
        setEditForm({
            name: turf.name,
            sport_type: turf.sport_type,
            city: turf.city,
            location: turf.location,
            amenities: turf.amenities || '',
            price: turf.price
        });
        setEditImage(null);
    };

    const handleEditTurf = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const formData = new FormData();
            formData.append('owner_id', user.id);
            formData.append('name', editForm.name);
            formData.append('sport_type', editForm.sport_type);
            formData.append('city', editForm.city);
            formData.append('location', editForm.location);
            formData.append('amenities', editForm.amenities);
            formData.append('price', editForm.price);
            if (editImage) formData.append('image', editImage);

            await api.put(`/turfs/${editingTurf.id}`, formData);
            alert('Turf updated successfully!');
            setEditingTurf(null);
            fetchMyData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to update turf');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteTurf = async (turf) => {
        if (!window.confirm(`Are you sure you want to delete "${turf.name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/turfs/${turf.id}`, { data: { owner_id: user.id } });
            alert('Turf deleted successfully!');
            fetchMyData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete turf');
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: activeTab === id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--text-color)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                opacity: activeTab === id ? 1 : 0.7
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '80px' }}>
            <header className="flex justify-between" style={{ marginBottom: '24px', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(45deg, var(--primary-color), #2196F3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Owner Dashboard
                    </h2>
                    <p className="text-secondary text-sm">Manage your sports venue</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: '#ffebee',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#d32f2f',
                            transition: 'transform 0.2s'
                        }}
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p style={{ fontSize: '12px', color: '#1565C0', fontWeight: 'bold' }}>REVENUE</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0D47A1' }}>₹{totalRevenue}</h3>
                        </div>
                        <DollarSign size={24} color="#1565C0" />
                    </div>
                </div>
                <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 'bold' }}>BOOKINGS</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1B5E20' }}>{totalBookings}</h3>
                        </div>
                        <Calendar size={24} color="#2E7D32" />
                    </div>
                </div>
                <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p style={{ fontSize: '12px', color: '#EF6C00', fontWeight: 'bold' }}>TOTAL TURFS</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#E65100' }}>{myTurfs.length}</h3>
                        </div>
                        <MapPin size={24} color="#EF6C00" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                <TabButton id="dashboard" label="Schedule" icon={LayoutDashboard} />
                <TabButton id="my-turfs" label="My Turfs" icon={MapPin} />
                <TabButton id="manage" label="Quick Block" icon={Wrench} />
                <TabButton id="add-turf" label="Add Turf" icon={Plus} />
            </div>

            {/* Content Area */}
            {activeTab === 'dashboard' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Upcoming Schedule</h3>
                        <span style={{ fontSize: '12px', background: '#eee', padding: '4px 8px', borderRadius: '12px' }}>
                            {upcomingBookings.length} Active
                        </span>
                    </div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        {loading && <p>Loading schedule...</p>}
                        {!loading && upcomingBookings.length === 0 && (
                            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <Calendar size={48} className="text-secondary" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p className="text-secondary">No upcoming bookings found.</p>
                                <button onClick={() => setActiveTab('manage')} className="btn" style={{ marginTop: '16px' }}>
                                    Block a Slot
                                </button>
                            </div>
                        )}
                        {upcomingBookings.map(booking => (
                            <div key={booking.id} className="card flex justify-between"
                                style={{
                                    padding: '16px',
                                    borderLeft: `5px solid ${booking.amount === 0 ? '#9E9E9E' : '#4CAF50'}`,
                                    background: booking.amount === 0 ? '#F5F5F5' : 'white'
                                }}>
                                <div className="flex gap-3">
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f5f5f5', padding: '8px', borderRadius: '8px', minWidth: '60px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>{booking.date.split('-')[2]}</span>
                                        <span style={{ fontSize: '10px', color: '#999' }}>{booking.start_time.substring(0, 5)}</span>
                                    </div>
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '16px' }}>{booking.turf_name}</strong>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            {booking.amount === 0 ? 'Maintenance / Offline Block' : `Paid: ₹${booking.amount}`}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <span style={{
                                        fontSize: '11px',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        background: booking.amount === 0 ? '#E0E0E0' : '#E8F5E9',
                                        color: booking.amount === 0 ? '#616161' : '#2E7D32',
                                        fontWeight: 'bold'
                                    }}>
                                        {booking.amount === 0 ? 'BLOCKED' : 'CONFIRMED'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'my-turfs' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>My Listed Turfs</h3>
                        <button onClick={() => setActiveTab('add-turf')} className="btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <Plus size={14} style={{ marginRight: '4px' }} /> Add New
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {myTurfs.map(turf => (
                            <div key={turf.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                                <div style={{ height: '140px', background: '#eee', position: 'relative' }}>
                                    {turf.image_url ? (
                                        <img src={turf.image_url} alt={turf.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                            No Image
                                        </div>
                                    )}
                                    <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                                        {turf.sport_type}
                                    </span>
                                </div>
                                <div style={{ padding: '16px' }}>
                                    <div className="flex justify-between items-start">
                                        <h4 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{turf.name}</h4>
                                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>₹{turf.price}/hr</span>
                                    </div>
                                    <p className="text-secondary text-sm" style={{ marginBottom: '8px' }}>{turf.location}, {turf.city}</p>
                                    <p className="text-secondary text-xs" style={{ marginBottom: '12px' }}>{turf.amenities}</p>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn outline"
                                            style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                                            onClick={() => openEditModal(turf)}
                                        >✏️ Edit</button>
                                        <button
                                            className="btn outline"
                                            style={{ flex: 1, fontSize: '12px', padding: '8px', borderColor: '#d32f2f', color: '#d32f2f' }}
                                            onClick={() => handleDeleteTurf(turf)}
                                        >🗑️ Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {myTurfs.length === 0 && (
                            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                                <MapPin size={48} className="text-secondary" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p className="text-secondary">You haven't listed any turfs yet.</p>
                                <button onClick={() => setActiveTab('add-turf')} className="btn" style={{ marginTop: '16px' }}>
                                    Add Your First Turf
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'manage' && (
                <div className="animate-fade-in">
                    <div className="card">
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                            {isMaintenance ? 'Maintenance Block' : 'Quick Block / Offline Booking'}
                        </h3>
                        <p className="text-secondary text-sm" style={{ marginBottom: '20px' }}>
                            Block a slot for walk-ins or maintenance.
                        </p>

                        <form onSubmit={handleAddOfflineBooking}>
                            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsMaintenance(false)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        background: !isMaintenance ? '#E3F2FD' : 'white',
                                        color: !isMaintenance ? '#1976D2' : '#666',
                                        fontWeight: !isMaintenance ? 'bold' : 'normal'
                                    }}
                                >
                                    Booking
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsMaintenance(true)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        background: isMaintenance ? '#FFEBEE' : 'white',
                                        color: isMaintenance ? '#C62828' : '#666',
                                        fontWeight: isMaintenance ? 'bold' : 'normal'
                                    }}
                                >
                                    Maintenance
                                </button>
                            </div>

                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Select Turf</label>
                            <select
                                required
                                value={newBooking.turf_id}
                                onChange={(e) => setNewBooking({ ...newBooking, turf_id: e.target.value })}
                                style={{ marginBottom: '16px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="">Select Turf</option>
                                {myTurfs.map(turf => (
                                    <option key={turf.id} value={turf.id}>{turf.name}</option>
                                ))}
                            </select>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newBooking.date}
                                        onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Time</label>
                                    <select
                                        required
                                        value={newBooking.start_time}
                                        onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">Select Time</option>
                                        {[...Array(14)].map((_, i) => (
                                            <option key={i} value={`${i + 9}:00`}>{i + 9}:00</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button className="btn" style={{ width: '100%', background: isMaintenance ? '#757575' : 'var(--primary-color)' }}>
                                {isMaintenance ? <Wrench size={16} style={{ marginRight: '8px' }} /> : <Plus size={16} style={{ marginRight: '8px' }} />}
                                {isMaintenance ? 'Block for Maintenance' : 'Confirm Offline Booking'}
                            </button>
                        </form>
                    </div>
                </div>
            )}


            {
                activeTab === 'add-turf' && (
                    <div className="animate-fade-in">
                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Add New Turf</h3>
                            <form onSubmit={handleAddTurf}>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Turf Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newTurf.name}
                                            onChange={(e) => setNewTurf({ ...newTurf, name: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                            placeholder="e.g. Green Valley Arena"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Sport Type</label>
                                        <select
                                            value={newTurf.sport_type}
                                            onChange={(e) => setNewTurf({ ...newTurf, sport_type: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                        >
                                            <option value="Cricket">Cricket</option>
                                            <option value="Football">Football</option>
                                            <option value="Badminton">Badminton</option>
                                            <option value="Tennis">Tennis</option>
                                            <option value="Basketball">Basketball</option>
                                            <option value="Swimming">Swimming</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>City</label>
                                            <input
                                                type="text"
                                                required
                                                value={newTurf.city}
                                                onChange={(e) => setNewTurf({ ...newTurf, city: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                                placeholder="Mumbai"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Price per Hour</label>
                                            <input
                                                type="number"
                                                required
                                                value={newTurf.price}
                                                onChange={(e) => setNewTurf({ ...newTurf, price: e.target.value })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                                placeholder="1200"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Location / Address</label>
                                        <input
                                            type="text"
                                            required
                                            value={newTurf.location}
                                            onChange={(e) => setNewTurf({ ...newTurf, location: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                            placeholder="Full address of the venue"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Amenities (comma separated)</label>
                                        <input
                                            type="text"
                                            value={newTurf.amenities}
                                            onChange={(e) => setNewTurf({ ...newTurf, amenities: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                            placeholder="Parking, WiFi, Changing Room, Water"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Turf Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setNewTurf({ ...newTurf, image: e.target.files[0] })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                        />
                                        <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>Upload a photo of your venue</p>
                                    </div>

                                    <button className="btn" style={{ width: '100%', marginTop: '8px' }}>
                                        <Plus size={16} style={{ marginRight: '8px' }} />
                                        List Turf
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            {/* Edit Turf Modal */}
            {editingTurf && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '16px'
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>✏️ Edit Turf</h3>
                            <button onClick={() => setEditingTurf(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                        </div>
                        <form onSubmit={handleEditTurf}>
                            <div style={{ display: 'grid', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Turf Name</label>
                                    <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Sport Type</label>
                                    <select value={editForm.sport_type} onChange={e => setEditForm({ ...editForm, sport_type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                        <option>Cricket</option>
                                        <option>Football</option>
                                        <option>Badminton</option>
                                        <option>Tennis</option>
                                        <option>Basketball</option>
                                        <option>Swimming</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>City</label>
                                        <input type="text" required value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Price/hr (₹)</label>
                                        <input type="number" required value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Location / Address</label>
                                    <input type="text" required value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Amenities (comma separated)</label>
                                    <input type="text" value={editForm.amenities} onChange={e => setEditForm({ ...editForm, amenities: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} placeholder="Parking, WiFi, Changing Room" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Change Image (optional)</label>
                                    <input type="file" accept="image/*" onChange={e => setEditImage(e.target.files[0])} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <button type="button" onClick={() => setEditingTurf(null)} className="btn outline" style={{ flex: 1 }}>Cancel</button>
                                    <button type="submit" className="btn" style={{ flex: 1 }} disabled={editLoading}>
                                        {editLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
