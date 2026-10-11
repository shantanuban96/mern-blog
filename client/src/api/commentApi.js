import http from './http';

export const getComments = (postId, params) =>
  http.get(`/posts/${postId}/comments`, { params }).then((res) => res.data);
export const addComment = (postId, content) =>
  http.post(`/posts/${postId}/comments`, { content }).then((res) => res.data);
export const updateComment = (id, content) => http.patch(`/comments/${id}`, { content }).then((res) => res.data);
export const deleteComment = (id) => http.delete(`/comments/${id}`).then((res) => res.data);
