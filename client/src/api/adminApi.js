import http from './http';

export const getStats = () => http.get('/admin/stats').then((res) => res.data);
export const getActivity = (params) => http.get('/admin/activity', { params }).then((res) => res.data);

export const getUsers = (params) => http.get('/admin/users', { params }).then((res) => res.data);
export const updateUser = (id, data) => http.patch(`/admin/users/${id}`, data).then((res) => res.data);

export const getPosts = (params) => http.get('/admin/posts', { params }).then((res) => res.data);
export const restorePost = (id) => http.patch(`/admin/posts/${id}/restore`).then((res) => res.data);

export const getComments = (params) => http.get('/admin/comments', { params }).then((res) => res.data);
