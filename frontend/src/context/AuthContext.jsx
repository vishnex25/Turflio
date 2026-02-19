import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, signupUser } from '../services/api';

// Default value prevents "cannot destructure undefined" if useAuth() is called
// before the Provider tree is ready.
const AuthContext = createContext({ user: null, loading: true, login: () => { }, signup: () => { }, logout: () => { } });

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
            } catch (e) {
                // Silent catch
            }
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const data = await loginUser(credentials);
            if (data.user) {
                // If admin, they also log in via same path
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                return data.user;
            }
        } catch (error) {
            throw error;
        }
    };

    const signup = async (userData) => {
        try {
            const data = await signupUser(userData);
            // Auto login after signup?
            // setUser(data.user);
            // localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
