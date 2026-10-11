import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as commentApi from '../api/commentApi';
import { getErrorMessage } from '../api/http';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import { commentSchema, validateForm } from '../schemas';
import { formatDate } from '../utils/format';
import Pagination from './Pagination';

export default function CommentSection({ postId }) {
  const { user, isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const { data: comments, meta, loading, error, reload } = useFetch(
    () => commentApi.getComments(postId, { page }),
    [postId, page]
  );

  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const canManage = (comment) => user && (user._id === comment.author?._id || isAdmin);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { data, errors } = validateForm(commentSchema, { content });
    if (errors) return setFormError(errors.content);

    try {
      await commentApi.addComment(postId, data.content);
      setContent('');
      setFormError('');
      setPage(1);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleSave = async (id) => {
    const { data, errors } = validateForm(commentSchema, { content: editText });
    if (errors) return alert(errors.content);

    try {
      await commentApi.updateComment(id, data.content);
      setEditingId(null);
      reload();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentApi.deleteComment(id);
      reload();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <section className="comments">
      <h3>Comments {meta && `(${meta.total})`}</h3>

      {user ? (
        <form onSubmit={handleAdd}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
          />
          {formError && <p className="error">{formError}</p>}
          <button className="btn" type="submit">
            Add comment
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link to="/login">Log in</Link> to comment.
        </p>
      )}

      {loading && <p>Loading comments...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && comments?.length === 0 && <p className="muted">No comments yet.</p>}

      {comments?.map((comment) => (
        <div key={comment._id} className="comment">
          <p className="muted">
            {comment.author?.name} · {formatDate(comment.createdAt)}
          </p>

          {editingId === comment._id ? (
            <>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} />
              <button className="btn btn-small" onClick={() => handleSave(comment._id)}>
                Save
              </button>
              <button className="btn btn-small btn-light" onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </>
          ) : (
            <p className="pre-wrap">{comment.content}</p>
          )}

          {canManage(comment) && editingId !== comment._id && (
            <div className="actions">
              <button
                className="btn btn-small btn-light"
                onClick={() => {
                  setEditingId(comment._id);
                  setEditText(comment.content);
                }}
              >
                Edit
              </button>
              <button className="btn btn-small btn-danger" onClick={() => handleDelete(comment._id)}>
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      <Pagination meta={meta} onPageChange={setPage} />
    </section>
  );
}
