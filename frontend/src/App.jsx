
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import TurfDetails from './pages/TurfDetails';
import BookingConfirm from './pages/BookingConfirm';
import Bookings from './pages/Bookings';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import ChatList from './pages/ChatList';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import JoinGame from './pages/JoinGame';
import useHeartbeat from './hooks/useHeartbeat';

// ── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const auth = useAuth();
  const user = auth?.user;
  const loading = auth?.loading;

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/super-admin" replace />;
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// ── Layout with bottom nav ───────────────────────────────────────────────────
const Layout = ({ children }) => (
  <>
    {children ? children : <Outlet />}
    <BottomNav />
  </>
);

// ── Root redirect based on role ──────────────────────────────────────────────
const HomeOrRedirect = () => {
  const auth = useAuth();
  const user = auth?.user;
  const loading = auth?.loading;

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/super-admin" replace />;
  if (user.role === 'owner') return <Navigate to="/owner" replace />;
  return <Layout><Home /></Layout>;
};

// ── All routes (must be inside AuthProvider) ─────────────────────────────────
function AppRoutes() {
  useHeartbeat(); // Keeps logged-in user's online status accurate
  return (
    <Routes>
      {/* ── Public routes (no auth needed) ── */}
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />

      {/* ── Public: friends join via shared game link ── */}
      <Route path="/join/:game_id" element={<JoinGame />} />

      {/* ── User routes ── */}
      <Route element={<ProtectedRoute roles={['user']}><Layout /></ProtectedRoute>}>
        <Route path="/turf/:id" element={<TurfDetails />} />
        <Route path="/booking/confirm" element={<BookingConfirm />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:friendId" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* ── Owner routes ── */}
      <Route path="/owner"
        element={<ProtectedRoute roles={['owner']}><AdminDashboard /></ProtectedRoute>}
      />

      {/* ── Admin routes ── */}
      <Route path="/super-admin"
        element={<ProtectedRoute roles={['admin']}><SuperAdminDashboard /></ProtectedRoute>}
      />

      {/* ── Root ── */}
      <Route path="/" element={<HomeOrRedirect />} />

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Redirect logged-in users away from /login and /signup
const PublicOnlyRoute = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user;
  const loading = auth?.loading;
  if (loading) return <div className="container">Loading...</div>;
  return user ? <Navigate to="/" replace /> : children;
};

// ── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ fontSize: '12px' }}>{this.state.error?.toString()}</pre>
          <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Root App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
