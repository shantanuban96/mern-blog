const Comment = require('../models/Comment');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notifyUser } = require('../socket');

const AUTHOR_FIELDS = 'name avatar';

async function findActivePost(postId) {
  const post = await Post.findOne({ _id: postId, isDeleted: false }).select('title slug author').lean();
  if (!post) throw ApiError.notFound('Post not found');
  return post;
}

async function listComments(postId, query) {
  await findActivePost(postId);
  const { page, limit, skip } = getPagination(query);

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS)
      .lean(),
    Comment.countDocuments({ post: postId }),
  ]);

  return { comments, meta: buildMeta({ page, limit }, total) };
}

async function createComment(postId, content, user) {
  const post = await findActivePost(postId);
  const comment = await Comment.create({ post: postId, author: user.id, content });

  // Real-time notification to the post author (not when commenting on your own post)
  if (post.author.toString() !== user.id) {
    notifyUser(post.author, {
      message: `${user.name} commented on "${post.title}"`,
      link: `/posts/${post.slug}`,
    });
  }

  return comment.populate('author', AUTHOR_FIELDS);
}

// Returns the mongoose document; used by the ownership middleware
async function findCommentById(id) {
  const comment = await Comment.findById(id);
  if (!comment) throw ApiError.notFound('Comment not found');
  return comment;
}

async function updateComment(comment, content) {
  comment.content = content;
  await comment.save();
  return comment.populate('author', AUTHOR_FIELDS);
}

async function deleteComment(comment) {
  await comment.deleteOne();
}

module.exports = { listComments, createComment, findCommentById, updateComment, deleteComment };
