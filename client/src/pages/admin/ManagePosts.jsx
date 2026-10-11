import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, restorePost } from '../../api/adminApi';
import { deletePost } from '../../api/postApi';
import { getErrorMessage } from '../../api/http';
import useFetch from '../../hooks/useFetch';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function ManagePosts() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const { data: posts, meta, loading, error, reload } = useFetch(() => getPosts({ page, status }), [page, status]);

  // Admins use the same delete endpoint as authors; the API lets admins delete any post
  const runAction = async (action, id) => {
    try {
      await action(id);
      reload();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h1>Posts</h1>
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="deleted">Deleted</option>
      </select>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Created</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {posts?.map((post) => (
            <tr key={post._id}>
              <td>{post.isDeleted ? post.title : <Link to={`/posts/${post.slug}`}>{post.title}</Link>}</td>
              <td>{post.author?.name}</td>
              <td>{formatDate(post.createdAt)}</td>
              <td>{post.isDeleted ? 'Deleted' : 'Active'}</td>
              <td>
                {post.isDeleted ? (
                  <button className="btn btn-small" onClick={() => runAction(restorePost, post._id)}>
                    Restore
                  </button>
                ) : (
                  <>
                    <Link className="btn btn-small btn-light" to={`/posts/${post._id}/edit`}>
                      Edit
                    </Link>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => window.confirm('Delete this post?') && runAction(deletePost, post._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
