import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getComments } from '../../api/adminApi';
import { deleteComment } from '../../api/commentApi';
import { getErrorMessage } from '../../api/http';
import useFetch from '../../hooks/useFetch';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function ManageComments() {
  const [page, setPage] = useState(1);
  const { data: comments, meta, loading, error, reload } = useFetch(() => getComments({ page }), [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(id);
      reload();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h1>Comments</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Comment</th>
            <th>Author</th>
            <th>Post</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {comments?.map((comment) => (
            <tr key={comment._id}>
              <td>{comment.content}</td>
              <td>{comment.author?.name}</td>
              <td>
                {comment.post && !comment.post.isDeleted ? (
                  <Link to={`/posts/${comment.post.slug}`}>{comment.post.title}</Link>
                ) : (
                  <span className="muted">{comment.post?.title || '-'} (deleted)</span>
                )}
              </td>
              <td>{formatDate(comment.createdAt)}</td>
              <td>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(comment._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
