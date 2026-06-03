import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useChat } from './chat-context';
import Login from './pages/Login';
import Trips from './pages/Trips';
import NewTrip from './pages/NewTrip';
import Cars from './pages/Cars';
import Bookings from './pages/Bookings';
import Chat from './pages/Chat';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="shell center">Loading…</div>;

  return (
    <>
      {user && <TopNav />}
      <div className={`shell ${user ? '' : 'center'}`}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={user ? <Trips /> : <Navigate to="/login" replace />} />
          <Route path="/trips/new" element={user ? <NewTrip /> : <Navigate to="/login" replace />} />
          <Route path="/bookings" element={user ? <Bookings /> : <Navigate to="/login" replace />} />
          <Route path="/cars" element={user ? <Cars /> : <Navigate to="/login" replace />} />
          <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </div>
    </>
  );
}

const TABS = [
  { to: '/', icon: '🚗', label: 'Trips', end: true },
  { to: '/trips/new', icon: '＋', label: 'Offer', end: false },
  { to: '/bookings', icon: '🎟️', label: 'Bookings', end: false },
  { to: '/cars', icon: '🚙', label: 'Cars', end: false },
  { to: '/chat', icon: '💬', label: 'Chat', end: false },
];

function TopNav() {
  const { user, signOut } = useAuth();
  const { totalUnread } = useChat();
  const nav = useNavigate();

  return (
    <header className="topbar">
      <span className="brand">bro-trips</span>
      <nav className="tabs">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            <span className="tab-icon">
              {t.icon}
              {t.to === '/chat' && totalUnread > 0 && <span className="badge nav-badge">{totalUnread}</span>}
            </span>
            <span className="tab-label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
      <span className="me">
        <span className="me-name">{user!.name}</span>
        <button
          className="secondary"
          onClick={() => {
            signOut();
            nav('/login', { replace: true });
          }}
        >
          Sign out
        </button>
      </span>
    </header>
  );
}
