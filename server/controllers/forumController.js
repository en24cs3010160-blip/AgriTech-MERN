const ForumPost = require('../models/ForumPost');

exports.createPost = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: 'Post title and content are required'
      });
    }

    const post = await ForumPost.create({
      author: req.user.id,
      authorName: req.user.name || 'Farmer',
      title: title.trim(),
      content: content.trim(),
      category: category || 'General Discussion'
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to publish forum post' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve forum posts' });
  }
};

exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content cannot be empty' });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    post.replies.push({
      author: req.user.id,
      authorName: req.user.name || 'Farmer',
      content: content.trim(),
      createdAt: new Date()
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add reply' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    post.likes = (post.likes || 0) + 1;
    await post.save();

    res.json({ likes: post.likes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to like post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    // Allow author or admin to delete
    if (String(post.author) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await ForumPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

