const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');
const { getPagination, buildMeta } = require('../utils/pagination');

// Only populate the author fields we actually show
const AUTHOR_FIELDS = 'name avatar';

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(value);

// "My First Post" -> "my-first-post", or "my-first-post-lq3k2x" if taken
async function generateSlug(title) {
  const base = slugify(title) || 'post';
  const taken = await Post.exists({ slug: base });
  return taken ? `${base}-${Date.now().toString(36)}` : base;
}

async function listPosts(query) {
  const { page, limit, skip } = getPagination(query);

  const filter = { isDeleted: false };
  if (query.author) filter.author = query.author;
  if (query.search) filter.$text = { $search: query.search };

  // Run the page query and the count at the same time
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .select('-content') // the list only needs the excerpt
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return { posts, meta: buildMeta({ page, limit }, total) };
}

// Posts can be opened by slug (/posts/my-first-post) or by id
async function getPost(idOrSlug) {
  const filter = isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const post = await Post.findOne({ ...filter, isDeleted: false }).populate('author', AUTHOR_FIELDS).lean();
  if (!post) throw ApiError.notFound('Post not found');
  return post;
}

// Returns the mongoose document; used by the ownership middleware before edit/delete
async function findPostById(id) {
  const post = await Post.findOne({ _id: id, isDeleted: false });
  if (!post) throw ApiError.notFound('Post not found');
  return post;
}

async function createPost({ title, content }, authorId) {
  const slug = await generateSlug(title);
  const post = await Post.create({ title, content, slug, author: authorId });
  return post.populate('author', AUTHOR_FIELDS);
}

// The slug is kept on edit so existing links keep working
async function updatePost(post, { title, content }) {
  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  await post.save();
  return post.populate('author', AUTHOR_FIELDS);
}

// Soft delete: hide the post instead of removing it
async function deletePost(post) {
  post.isDeleted = true;
  post.deletedAt = new Date();
  await post.save();
}

module.exports = { listPosts, getPost, findPostById, createPost, updatePost, deletePost };
