import http from './http';

export const getPosts = (params) => http.get('/posts', { params }).then((res) => res.data);
export const getPost = (idOrSlug) => http.get(`/posts/${idOrSlug}`).then((res) => res.data);
export const createPost = (data) => http.post('/posts', data).then((res) => res.data);
export const updatePost = (id, data) => http.patch(`/posts/${id}`, data).then((res) => res.data);
export const deletePost = (id) => http.delete(`/posts/${id}`).then((res) => res.data);
