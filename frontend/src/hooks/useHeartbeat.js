import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * Sends a heartbeat to the backend every 30 seconds so the server
 * knows this user is still online. When the user closes the tab or
 * the app, the heartbeat stops and after 2 minutes the backend
 * considers them offline.
 */
const useHeartbeat = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) return;

        const ping = () => {
            api.post(`/users/${user.id}/heartbeat`).catch(() => { });
        };

        // Ping immediately on mount
        ping();

        // Then every 30 seconds
        const interval = setInterval(ping, 30000);

        return () => clearInterval(interval);
    }, [user?.id]);
};

export default useHeartbeat;
