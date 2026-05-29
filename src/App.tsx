import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import Login from './pages/Login';
import Trips from './pages/Trips';
import NewTrip from './pages/NewTrip';
import Cars from './pages/Cars';
import Bookings from './pages/Bookings';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="shell">Loading…</div>;

  return (
    <>
      {user && <TopNav />}
      <div className="shell">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={user ? <Trips /> : <Navigate to="/login" replace />} />
          <Route path="/trips/new" element={user ? <NewTrip /> : <Navigate to="/login" replace />} />
          <Route path="/cars" element={user ? <Cars /> : <Navigate to="/login" replace />} />
          <Route path="/bookings" element={user ? <Bookings /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </div>
    </>
  );
}

function TopNav() {
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const is = (p: string) => (loc.pathname === p ? 'tag ok' : 'tag');
  return (
    <nav className="top">
      <span className="brand">bro-trips</span>
      <Link to="/" className={is('/')}>Trips</Link>
      <Link to="/trips/new" className={is('/trips/new')}>Offer ride</Link>
      <Link to="/bookings" className={is('/bookings')}>My bookings</Link>
      <Link to="/cars" className={is('/cars')}>My cars</Link>
      <span className="me">
        <span>{user!.name}</span>
        <button
          className="secondary"
          onClick={() => {
            signOut();
            nav('/login', { replace: true });
          }}
        >
          sign out
        </button>
      </span>
    </nav>
  );
}
