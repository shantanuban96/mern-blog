import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// After Google/Facebook login the server sets the refresh cookie and redirects here.
// AuthContext restores the session on page load, so we just wait for it.
export default function OAuthCallback() {
  const { user, loading } = useAuth();

  if (loading) return <p className="center">Signing you in...</p>;
  if (user) return <Navigate to="/" replace />;

  return (
    <p className="error center">
      Social login failed. <Link to="/login">Back to login</Link>
    </p>
  );
}
