import { useEffect, useState } from 'react';
import api from '../api/client';
import Avatar from './Avatar';

export default function LikesModal({ type, id, onClose }) {
  const [likes, setLikes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/${type}s/${id}/likes`)
      .then(({ data }) => {
        if (!cancelled) setLikes(data.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load likes.');
      });

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  return (
    <div className="_modal_overlay" onClick={onClose}>
      <div className="_modal_box" onClick={(event) => event.stopPropagation()}>
        <div className="_modal_header">
          <h4>Liked by</h4>
          <button type="button" className="_modal_close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="_modal_body">
          {error && <p>{error}</p>}
          {!error && !likes && <p>Loading…</p>}
          {!error && likes && likes.length === 0 && <p>No likes yet.</p>}
          {likes?.map((like) => (
            <div className="_modal_like_row" key={like.id}>
              <Avatar name={like.user.name} size={32} />
              <span>{like.user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
