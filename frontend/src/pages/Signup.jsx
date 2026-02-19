import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User } from 'lucide-react';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signup({ name, email, password });
            alert('Account created! Please log in.');
            navigate('/login');
        } catch (err) {
            setError('Signup failed. Email might be taken.');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', background: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Join Us ⚽</h1>
                <p className="text-secondary">Create your account</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <User size={20} className="text-secondary" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                        required
                    />
                </div>

                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Mail size={20} className="text-secondary" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                        type="email"
                        placeholder="Email (Gmail)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                        required
                    />
                </div>

                <div style={{ position: 'relative', marginBottom: '24px' }}>
                    <Lock size={20} className="text-secondary" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                        required
                    />
                </div>

                {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

                <button className="btn" style={{ width: '100%', marginBottom: '16px' }}>
                    Sign Up
                </button>
            </form>

            <div style={{ textAlign: 'center' }}>
                <p className="text-secondary">Already have an account?</p>
                <button
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => navigate('/login')}
                >
                    Log In
                </button>
            </div>
        </div>
    );
};

export default Signup;
