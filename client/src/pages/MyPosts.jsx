import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePost, getPosts } from '../api/postApi';
import { getErrorMessage } from '../api/http';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/format';

export default function MyPosts() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data: posts, meta, loading, error, reload } = useFetch(
    () => getPosts({ author: user._id, page }),
    [user._id, page]
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(id);
      reload();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h1>My posts</h1>
      <Link className="btn" to="/posts/new">
        Write a new post
      </Link>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && posts?.length === 0 && <p className="muted">You haven&apos;t written anything yet.</p>}

      {posts?.map((post) => (
        <div key={post._id} className="card row">
          <div>
            <Link to={`/posts/${post.slug}`}>{post.title}</Link>
            <p className="muted">{formatDate(post.createdAt)}</p>
          </div>
          <div className="actions">
            <Link className="btn btn-small btn-light" to={`/posts/${post._id}/edit`}>
              Edit
            </Link>
            <button className="btn btn-small btn-danger" onClick={() => handleDelete(post._id)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
