const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

const forumPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: [
        'Crop Advice',
        'Pest Management',
        'Market Rates',
        'Farming Equipment',
        'Organic Techniques',
        'General Discussion'
      ],
      default: 'General Discussion'
    },
    likes: {
      type: Number,
      default: 0
    },
    replies: [replySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('ForumPost', forumPostSchema);

