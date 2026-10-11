const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/env');
const { ROLES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Optional because a Facebook login may not share an email
    email: { type: String, trim: true, lowercase: true },
    // Optional because social-login users have no password. Never returned by default.
    password: { type: String, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    isActive: { type: Boolean, default: true },
    avatar: String,
    googleId: String,
    facebookId: String,
  },
  { timestamps: true }
);

// Unique only when the field exists (social users may not have an email)
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } });
userSchema.index({ facebookId: 1 }, { unique: true, partialFilterExpression: { facebookId: { $type: 'string' } } });

// Hash the password whenever it is set or changed
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

// Never leak sensitive fields in JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.googleId;
    delete ret.facebookId;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
