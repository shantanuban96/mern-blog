import http from './http';

// Every function returns the API body: { success, data, meta? }
export const register = (data) => http.post('/auth/register', data).then((res) => res.data);
export const login = (data) => http.post('/auth/login', data).then((res) => res.data);
export const logout = () => http.post('/auth/logout').then((res) => res.data);
export const getProviders = () => http.get('/auth/providers').then((res) => res.data);
