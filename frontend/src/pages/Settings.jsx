import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Check, Wallet } from 'lucide-react';

const Settings = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [upiId, setUpiId] = useState('');
    const [upiSaved, setUpiSaved] = useState(false);
    const [upiLoading, setUpiLoading] = useState(false);
    const [upiError, setUpiError] = useState('');

    // Load existing UPI ID
    useEffect(() => {
        if (!user) return;
        api.get(`/users/${user.id}`)
            .then(res => setUpiId(res.data.upi_id || ''))
            .catch(() => { });
    }, [user]);

    const handleSaveUpi = async () => {
        setUpiLoading(true);
        setUpiError('');
        setUpiSaved(false);
        try {
            await api.patch(`/users/${user.id}/upi`, { upi_id: upiId });
            setUpiSaved(true);
            setTimeout(() => setUpiSaved(false), 3000);
        } catch (e) {
            setUpiError('Failed to save. Please try again.');
        } finally {
            setUpiLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '16px' }}
                >←</button>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Settings</h2>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>

                {/* ── UPI / Payment Details ── */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <Wallet size={20} color="var(--primary-color)" />
                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>UPI / Payment Details</h3>
                    </div>
                    <p className="text-secondary text-sm" style={{ marginBottom: '14px' }}>
                        Set your UPI ID so friends can pay you directly when you organise a split booking.
                    </p>

                    <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Your UPI ID
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. yourname@gpay or 9876543210@paytm"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        style={{ marginBottom: '10px', fontFamily: 'monospace' }}
                    />

                    {upiError && (
                        <div style={{ color: '#c62828', fontSize: '13px', marginBottom: '8px' }}>⚠️ {upiError}</div>
                    )}

                    <button
                        className="btn"
                        style={{
                            width: '100%', padding: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            background: upiSaved ? '#4CAF50' : undefined,
                            transition: 'background 0.3s'
                        }}
                        onClick={handleSaveUpi}
                        disabled={upiLoading}
                    >
                        {upiSaved ? (
                            <><Check size={16} /> Saved!</>
                        ) : upiLoading ? 'Saving…' : 'Save UPI ID'}
                    </button>

                    {/* Quick UPI format hints */}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['@gpay', '@paytm', '@ybl', '@okaxis', '@ibl'].map(suffix => (
                            <span
                                key={suffix}
                                onClick={() => {
                                    const base = upiId.split('@')[0] || '';
                                    setUpiId(base + suffix);
                                }}
                                style={{
                                    background: '#f0f4ff', color: '#3949ab',
                                    padding: '4px 10px', borderRadius: '20px',
                                    fontSize: '12px', cursor: 'pointer', fontFamily: 'monospace'
                                }}
                            >
                                {suffix}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Account Privacy ── */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Account Privacy</h3>
                    <div className="flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <span>Show my Online Status</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex justify-between" style={{ padding: '8px 0' }}>
                        <span>Allow Friend Requests</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>

                {/* ── Notifications ── */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Notifications</h3>
                    <div className="flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <span>Match Reminders</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex justify-between" style={{ padding: '8px 0' }}>
                        <span>New Messages</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>

                {/* ── Support ── */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Support</h3>
                    <button style={{ width: '100%', padding: '12px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Help Center
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Settings;
