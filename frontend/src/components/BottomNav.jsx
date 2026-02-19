import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, MessageSquare, User } from 'lucide-react';

const BottomNav = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/bookings', icon: Calendar, label: 'Bookings' },
        { path: '/friends', icon: Users, label: 'Friends' },
        { path: '/chat', icon: MessageSquare, label: 'Chat' },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px 0',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
            zIndex: 1000
        }}>
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textDecoration: 'none',
                        color: isActive(item.path) ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontSize: '12px',
                        flex: 1
                    }}
                >
                    <item.icon size={24} />
                    <span style={{ marginTop: '4px' }}>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export default BottomNav;
