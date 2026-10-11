import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getErrorMessage, getFieldErrors } from '../api/http';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { registerSchema, validateForm } from '../schemas';

export default function Register() {
  const { user, register } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, errors: validationErrors } = validateForm(registerSchema, form);
    if (validationErrors) return setErrors(validationErrors);

    setErrors({});
    try {
      const { name, email, password } = data;
      await register({ name, email, password }); // sets the user, which redirects home
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage(getErrorMessage(err));
    }
  };

  return (
    <form className="form narrow" onSubmit={handleSubmit} noValidate>
      <h1>Create an account</h1>
      {message && <p className="error">{message}</p>}

      <FormField label="Name" name="name" value={form.name} onChange={handleChange} error={errors.name} />
      <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
      />
      <FormField
        label="Confirm password"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />

      <button className="btn" type="submit">
        Register
      </button>

      <SocialLoginButtons />

      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </form>
  );
}
