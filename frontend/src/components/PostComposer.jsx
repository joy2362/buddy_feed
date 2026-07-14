import { useRef, useState } from 'react';
import api from '../api/client';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

export default function PostComposer({ onPostCreated }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [visibility, setVisibility] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!body.trim() && !image) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    if (body.trim()) formData.append('body', body.trim());
    if (image) formData.append('image', image);
    formData.append('visibility', visibility);

    try {
      const { data } = await api.post('/posts', formData);
      onPostCreated(data.data);
      setBody('');
      removeImage();
      setVisibility('public');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
      <form onSubmit={handleSubmit}>
        <div className="_feed_inner_text_area_box">
          <div className="_feed_inner_text_area_box_image">
            <Avatar name={user?.name} size={40} />
          </div>
          <div className="form-floating _feed_inner_text_area_box_form">
            <textarea
              className="form-control _textarea"
              placeholder="Write something ..."
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
        </div>

        {imagePreview && (
          <div className="_post_image_preview_wrap">
            <img src={imagePreview} alt="Preview" className="_post_image_preview" />
            <button type="button" className="_remove_preview_btn" onClick={removeImage} aria-label="Remove image">
              &times;
            </button>
          </div>
        )}

        {error && <div className="_field_error _mar_b8">{error}</div>}

        <div className="_feed_inner_text_area_bottom">
          <div className="_feed_inner_text_area_item">
            <div className="_feed_inner_text_area_bottom_photo _feed_common">
              <button type="button" className="_feed_inner_text_area_bottom_photo_link" onClick={() => fileInputRef.current?.click()}>
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">📷</span>
                Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={handleImageChange}
              />
            </div>

            <select
              className="_privacy_select"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              aria-label="Post visibility"
            >
              <option value="public">🌐 Public</option>
              <option value="private">🔒 Only me</option>
            </select>
          </div>
          <div className="_feed_inner_text_area_btn">
            <button type="submit" className="_feed_inner_text_area_btn_link" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Posting…' : 'Post'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
