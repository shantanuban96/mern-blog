import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, getPost, updatePost } from '../api/postApi';
import { getErrorMessage, getFieldErrors } from '../api/http';
import FormField from '../components/FormField';
import { postSchema, validateForm } from '../schemas';

// Used for both "New post" (/posts/new) and "Edit post" (/posts/:id/edit)
export default function PostForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', content: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // In edit mode, load the existing post into the form
  useEffect(() => {
    if (!isEdit) return;
    getPost(id)
      .then((res) => setForm({ title: res.data.title, content: res.data.content }))
      .catch((err) => setMessage(getErrorMessage(err)));
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, errors: validationErrors } = validateForm(postSchema, form);
    if (validationErrors) return setErrors(validationErrors);

    setSaving(true);
    setErrors({});
    setMessage('');
    try {
      const res = isEdit ? await updatePost(id, data) : await createPost(data);
      navigate(`/posts/${res.data.slug}`);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h1>{isEdit ? 'Edit post' : 'New post'}</h1>
      {message && <p className="error">{message}</p>}

      <FormField label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} />
      <FormField
        label="Content"
        name="content"
        multiline
        rows={12}
        value={form.content}
        onChange={handleChange}
        error={errors.content}
      />

      <button className="btn" type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
