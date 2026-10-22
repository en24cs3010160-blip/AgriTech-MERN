const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  addReply,
  toggleLike,
  deletePost
} = require('../controllers/forumController');
const authMiddleware = require('../middleware/authMiddleware');

// Public to read forum posts
router.get('/', getPosts);

// Authenticated actions
router.post('/', authMiddleware, createPost);
router.post('/:id/replies', authMiddleware, addReply);
router.post('/:id/like', authMiddleware, toggleLike);
router.delete('/:id', authMiddleware, deletePost);

module.exports = router;

