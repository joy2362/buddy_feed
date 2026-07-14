import { useEffect, useState } from 'react';
import api from '../api/client';
import Avatar from './Avatar';
import CommentItem from './CommentItem';
import { useAuth } from '../context/AuthContext';

export default function CommentSection({ postId, onCommentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = async (cursor) => {
    setIsLoading(true);
    const { data } = await api.get(`/posts/${postId}/comments`, {
      params: cursor ? { cursor } : {},
    });
    setComments((prev) => (cursor ? [...prev, ...data.data] : data.data));
    setNextCursor(data.meta.next_cursor ?? undefined);
    setIsLoading(false);
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleReplyAdded = (parentId, reply) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId ? { ...comment, replies: [...(comment.replies || []), reply] } : comment,
      ),
    );
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { body: commentText });
      setComments((prev) => [...prev, data.data]);
      setCommentText('');
      onCommentAdded?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="_feed_inner_timeline_cooment_area">
      <div className="_feed_inner_comment_box">
        <form className="_feed_inner_comment_box_form" onSubmit={submitComment}>
          <div className="_feed_inner_comment_box_content">
            <div className="_feed_inner_comment_box_content_image">
              <Avatar name={user?.name} size={26} />
            </div>
            <div className="_feed_inner_comment_box_content_txt">
              <textarea
                className="form-control _comment_textarea"
                placeholder="Write a comment"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
            </div>
          </div>
          <div className="_feed_inner_text_area_btn">
            <button type="submit" className="_feed_inner_text_area_btn_link" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Posting…' : 'Comment'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="_timline_comment_main">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onReplyAdded={handleReplyAdded} />
        ))}

        {nextCursor && (
          <div className="_previous_comment">
            <button type="button" className="_previous_comment_txt" onClick={() => loadComments(nextCursor)} disabled={isLoading}>
              {isLoading ? 'Loading…' : 'View more comments'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
