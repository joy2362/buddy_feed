import { useState } from 'react';
import api from '../api/client';
import Avatar from './Avatar';
import CommentSection from './CommentSection';
import LikesModal from './LikesModal';
import { timeAgo } from '../utils/time';

export default function PostCard({ post, onCommentCountChanged }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  const toggleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));

    try {
      const { data } = await api.post(`/posts/${post.id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch {
      setLiked(!nextLiked);
      setLikesCount((count) => count + (nextLiked ? -1 : 1));
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount((count) => count + 1);
    onCommentCountChanged?.();
  };

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <Avatar name={post.user.name} size={44} />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">{post.user.name}</h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo(post.created_at)} .{' '}
                <span>{post.visibility === 'public' ? '🌐 Public' : '🔒 Only me'}</span>
              </p>
            </div>
          </div>
        </div>

        {post.body && <p className="_feed_inner_timeline_post_para _mar_b16">{post.body}</p>}

        {post.image_url && (
          <div className="_feed_inner_timeline_image _mar_b16">
            <img src={post.image_url} alt="" className="_time_img _post_body_image" />
          </div>
        )}
      </div>

      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <button type="button" className="_link_btn" onClick={() => likesCount > 0 && setShowLikes(true)}>
              <span>{likesCount}</span> Like{likesCount === 1 ? '' : 's'}
            </button>
          </p>
          <p className="_feed_inner_timeline_total_reacts_para2">
            <button type="button" className="_link_btn" onClick={() => setShowComments((v) => !v)}>
              <span>{commentsCount}</span> Comment{commentsCount === 1 ? '' : 's'}
            </button>
          </p>
        </div>
      </div>

      <div className="_feed_inner_timeline_reaction">
        <button
          type="button"
          className={liked ? '_feed_inner_timeline_reaction_emoji _feed_reaction _feed_reaction_active' : '_feed_inner_timeline_reaction_emoji _feed_reaction'}
          onClick={toggleLike}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>{liked ? '👍 Liked' : '👍 Like'}</span>
          </span>
        </button>
        <button type="button" className="_feed_inner_timeline_reaction_comment _feed_reaction" onClick={() => setShowComments((v) => !v)}>
          <span className="_feed_inner_timeline_reaction_link">
            <span>💬 Comment</span>
          </span>
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} onCommentAdded={handleCommentAdded} />}

      {showLikes && <LikesModal type="post" id={post.id} onClose={() => setShowLikes(false)} />}
    </div>
  );
}
