import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        MERN Blog
      </Link>

      <nav>
        <NavLink to="/" end>
          Home
        </NavLink>

        {user ? (
          <>
            <NavLink to="/posts/new">New Post</NavLink>
            <NavLink to="/my-posts">My Posts</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
            <NotificationBell />
            <span className="muted">Hi, {user.name}</span>
            <button className="btn btn-small" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
