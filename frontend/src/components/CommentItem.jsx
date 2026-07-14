import { useState } from 'react';
import api from '../api/client';
import Avatar from './Avatar';
import LikesModal from './LikesModal';
import { timeAgo } from '../utils/time';

export default function CommentItem({ comment, onReplyAdded, isReply = false }) {
  const [liked, setLiked] = useState(comment.liked_by_me);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  const toggleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));

    try {
      const { data } = await api.post(`/comments/${comment.id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch {
      setLiked(!nextLiked);
      setLikesCount((count) => count + (nextLiked ? -1 : 1));
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    if (!replyText.trim()) return;

    setIsReplying(true);
    try {
      const { data } = await api.post(`/comments/${comment.id}/replies`, { body: replyText });
      onReplyAdded(comment.id, data.data);
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <Avatar name={comment.user.name} size={isReply ? 32 : 40} />
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <h4 className="_comment_name_title">{comment.user.name}</h4>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{comment.body}</span>
            </p>
          </div>
          {likesCount > 0 && (
            <div className="_total_reactions">
              <button type="button" className="_like_count_link" onClick={() => setShowLikes(true)}>
                {likesCount} like{likesCount === 1 ? '' : 's'}
              </button>
            </div>
          )}
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <button
                    type="button"
                    className={liked ? '_reply_action_link _reply_action_active' : '_reply_action_link'}
                    onClick={toggleLike}
                  >
                    {liked ? 'Liked' : 'Like'}
                  </button>
                </li>
                {!isReply && (
                  <li>
                    <button type="button" className="_reply_action_link" onClick={() => setShowReplyForm((v) => !v)}>
                      Reply
                    </button>
                  </li>
                )}
                <li>
                  <span className="_time_link">{timeAgo(comment.created_at)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {showReplyForm && (
          <form className="_feed_inner_comment_box_form _mar_t8" onSubmit={submitReply}>
            <div className="_feed_inner_comment_box_content">
              <div className="_feed_inner_comment_box_content_txt">
                <textarea
                  className="form-control _comment_textarea"
                  placeholder="Write a reply"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                />
              </div>
            </div>
            <div className="_feed_inner_text_area_btn">
              <button type="submit" className="_feed_inner_text_area_btn_link" disabled={isReplying}>
                <span>{isReplying ? 'Posting…' : 'Reply'}</span>
              </button>
            </div>
          </form>
        )}

        {comment.replies?.length > 0 && (
          <div className="_reply_list">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} onReplyAdded={onReplyAdded} isReply />
            ))}
          </div>
        )}
      </div>

      {showLikes && <LikesModal type="comment" id={comment.id} onClose={() => setShowLikes(false)} />}
    </div>
  );
}
