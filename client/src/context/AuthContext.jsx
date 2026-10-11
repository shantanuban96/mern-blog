import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/authApi';
import { refreshSession, setAccessToken } from '../api/http';

// Global authentication state, available in every component through useAuth()
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know whether the user is logged in

  const startSession = ({ user: loggedInUser, accessToken }) => {
    setAccessToken(accessToken);
    setUser(loggedInUser);
  };

  const endSession = () => {
    setAccessToken(null);
    setUser(null);
  };

  // On page load, restore the session from the refresh cookie (also completes Google/Facebook login)
  useEffect(() => {
    refreshSession()
      .then(startSession)
      .catch(endSession)
      .finally(() => setLoading(false));

    window.addEventListener('session-expired', endSession);
    return () => window.removeEventListener('session-expired', endSession);
  }, []);

  const login = async (credentials) => startSession((await authApi.login(credentials)).data);

  const register = async (details) => startSession((await authApi.register(details)).data);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      endSession();
    }
  };

  const value = { user, loading, isAdmin: user?.role === 'admin', login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
