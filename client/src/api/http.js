import axios from 'axios';

// All requests go to /api/v1 (Vite forwards them to the Express server)
const http = axios.create({ baseURL: '/api/v1', withCredentials: true });

// The access token is kept in memory only (not localStorage), so injected scripts can't read it.
// The refresh token is in an httpOnly cookie that the browser sends automatically.
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

// Attach the access token to every request
http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Gets a new access token using the refresh cookie.
// Calls made at the same time share one request, because each refresh token can be used only once.
let refreshPromise = null;
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/v1/auth/refresh', null, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.data.accessToken);
        return res.data.data; // { user, accessToken }
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// If the access token has expired (401), refresh it once and retry the original request
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthRoute = request?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && !request._retried && !isAuthRoute) {
      request._retried = true;
      try {
        await refreshSession();
        return http(request);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event('session-expired')); // AuthContext logs the user out
      }
    }
    return Promise.reject(error);
  }
);

// Reads the message from our API error format: { success: false, error: { message } }
export const getErrorMessage = (error) => error.response?.data?.error?.message || 'Something went wrong';

// Turns API validation details into { field: message } for forms
export const getFieldErrors = (error) =>
  Object.fromEntries((error.response?.data?.error?.details || []).map((d) => [d.field, d.message]));

export default http;
