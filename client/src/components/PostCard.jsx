import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format';

export default function PostCard({ post }) {
  return (
    <article className="card">
      <h2>
        <Link to={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="muted">
        By {post.author?.name} · {formatDate(post.createdAt)}
      </p>
      <p>{post.excerpt}</p>
    </article>
  );
}
