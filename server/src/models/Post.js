const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    // Short preview so list pages don't need to load the full content
    excerpt: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Soft delete: the post stays in the DB but is hidden from users
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

// Indexes that match our most common queries
postSchema.index({ isDeleted: 1, createdAt: -1 }); // public feed, newest first
postSchema.index({ author: 1, isDeleted: 1, createdAt: -1 }); // "my posts"
postSchema.index({ title: 'text', content: 'text' }); // search

postSchema.pre('save', function setExcerpt() {
  if (this.isModified('content')) {
    this.excerpt = this.content.length > 200 ? `${this.content.slice(0, 200)}...` : this.content;
  }
});

module.exports = mongoose.model('Post', postSchema);
