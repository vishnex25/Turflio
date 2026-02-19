import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login({ username: email, password });
            if (user) {
                if (user.role === 'admin') navigate('/super-admin');
                else if (user.role === 'owner') navigate('/owner');
                else navigate('/');
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', background: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Turf App ⚽</h1>
                <p className="text-secondary">Welcome back!</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Mail size={20} className="text-secondary" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                        type="text"
                        placeholder="Email / User ID"
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
                    Log In
                </button>
            </form>

            <div style={{ textAlign: 'center' }}>
                <p className="text-secondary">Don't have an account?</p>
                <button
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => navigate('/signup')}
                >
                    Sign Up
                </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <a href="#" style={{ color: '#aaa', textDecoration: 'none', fontSize: '12px' }}>Forgot Password?</a>
            </div>
        </div>
    );
};

export default Login;
