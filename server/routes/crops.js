
const express = require('express');
const router = express.Router();

const {
  createCrop,
  getCrops,
  updateCrop,
  deleteCrop
} = require('../controllers/cropController');

const authMiddleware = require('../middleware/authMiddleware');

// Create a crop
router.post('/', authMiddleware, createCrop);

// Get all crops of logged-in farmer
router.get('/', authMiddleware, getCrops);

// Update a crop
router.put('/:id', authMiddleware, updateCrop);

// Delete a crop
router.delete('/:id', authMiddleware, deleteCrop);

module.exports = router;
