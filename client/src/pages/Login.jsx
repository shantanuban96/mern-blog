import { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../api/http';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { loginSchema, validateForm } from '../schemas';

// Errors the server can send back after a failed Google/Facebook login
const SOCIAL_ERRORS = {
  social_login_failed: 'Social login failed or your account is deactivated.',
  google_not_configured: 'Google login is not configured on the server.',
  facebook_not_configured: 'Facebook login is not configured on the server.',
};

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(SOCIAL_ERRORS[searchParams.get('error')] || '');

  // Once logged in, go back to the page the user originally wanted
  if (user) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, errors: validationErrors } = validateForm(loginSchema, form);
    if (validationErrors) return setErrors(validationErrors);

    setErrors({});
    try {
      await login(data); // sets the user, which triggers the redirect above
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  return (
    <form className="form narrow" onSubmit={handleSubmit} noValidate>
      <h1>Login</h1>
      {message && <p className="error">{message}</p>}

      <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
      />

      <button className="btn" type="submit">
        Login
      </button>

      <SocialLoginButtons />

      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </form>
  );
}
