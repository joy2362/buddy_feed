import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';

export default function Feed() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = async (cursor) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/posts', { params: cursor ? { cursor } : {} });
      setPosts((prev) => (cursor ? [...prev, ...data.data] : data.data));
      setNextCursor(data.meta.next_cursor ?? undefined);
    } catch {
      setError('Could not load the feed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePostCreated = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  return (
    <div className="_layout _layout_main_wrapper">
      <div className="_main_layout">
        <nav className="navbar navbar-expand-lg navbar-light _header_nav _padd_t10">
          <div className="container _custom_container">
            <div className="_logo_wrap">
              <img src="/assets/images/logo.svg" alt="BuddyFeed" className="_nav_logo" />
            </div>
            <div className="_header_user_area">
              <span className="_header_user_name">Hi, {user?.name}</span>
              <button type="button" className="_logout_btn" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="container _custom_container _feed_page_body">
          <div className="row justify-content-center">
            <div className="col-xl-7 col-lg-8 col-md-10 col-sm-12">
              <PostComposer onPostCreated={handlePostCreated} />

              {error && <div className="_field_error _mar_b16">{error}</div>}

              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {isLoading && <p className="_feed_status_text">Loading…</p>}
              {!isLoading && posts.length === 0 && !error && (
                <p className="_feed_status_text">No posts yet. Be the first to share something!</p>
              )}

              {nextCursor && (
                <div className="_previous_comment _mar_b16">
                  <button
                    type="button"
                    className="_previous_comment_txt"
                    onClick={() => loadPosts(nextCursor)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading…' : 'Load more posts'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
