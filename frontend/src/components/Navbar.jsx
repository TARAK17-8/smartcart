import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-brand-icon">🛡️</span>
        <span>Rural Health EWS</span>
      </Link>

      <div className="navbar-links">
        <Link
          to="/"
          className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          📥 Report
        </Link>

        <Link
          to="/user-dashboard"
          className={`navbar-link ${location.pathname === '/user-dashboard' ? 'active' : ''}`}
        >
          👥 User Dashboard
        </Link>

        {authenticated ? (
          <>
            <Link
              to="/dashboard"
              className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              📊 Admin
            </Link>
            <button className="navbar-link btn-logout" onClick={handleLogout}>
              🚪 Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`}
          >
            🔐 Admin Login
          </Link>
        )}
      </div>
    </nav>
  );
}
