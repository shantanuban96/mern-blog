import { Link, useNavigate, useParams } from 'react-router-dom';
import { deletePost, getPost } from '../api/postApi';
import { getErrorMessage } from '../api/http';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import CommentSection from '../components/CommentSection';
import { formatDate } from '../utils/format';

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { data: post, loading, error } = useFetch(() => getPost(slug), [slug]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  const canManage = user && (user._id === post.author?._id || isAdmin);

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(post._id);
      navigate('/');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <article>
      <h1>{post.title}</h1>
      <p className="muted">
        By {post.author?.name} · {formatDate(post.createdAt)}
        {post.updatedAt !== post.createdAt && ` · updated ${formatDate(post.updatedAt)}`}
      </p>

      {canManage && (
        <div className="actions">
          <Link className="btn btn-small btn-light" to={`/posts/${post._id}/edit`}>
            Edit
          </Link>
          <button className="btn btn-small btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}

      <div className="content pre-wrap">{post.content}</div>

      <CommentSection postId={post._id} />
    </article>
  );
}
