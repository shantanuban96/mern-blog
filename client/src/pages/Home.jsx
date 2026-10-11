import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPosts } from '../api/postApi';
import useFetch from '../hooks/useFetch';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';

export default function Home() {
  // Page and search live in the URL (?page=2&search=react) so they survive a refresh
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);

  const { data: posts, meta, loading, error } = useFetch(() => getPosts({ page, search }), [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(searchInput ? { search: searchInput } : {});
  };

  const goToPage = (newPage) => setSearchParams({ ...(search && { search }), page: newPage });

  return (
    <div>
      <h1>Latest posts</h1>

      <form className="search" onSubmit={handleSearch}>
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search posts..." />
        <button className="btn" type="submit">
          Search
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && posts?.length === 0 && <p className="muted">No posts found.</p>}

      {posts?.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}

      <Pagination meta={meta} onPageChange={goToPage} />
    </div>
  );
}
