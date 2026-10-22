
const express = require('express');
const router = express.Router();

const {
  createFarm,
  getFarms,
  updateFarm,
  deleteFarm
} = require('../controllers/farmController');

const authMiddleware = require('../middleware/authMiddleware');

// Create a farm
router.post('/', authMiddleware, createFarm);

// Get all farms of logged-in farmer
router.get('/', authMiddleware, getFarms);

// Update a farm
router.put('/:id', authMiddleware, updateFarm);

// Delete a farm
router.delete('/:id', authMiddleware, deleteFarm);

module.exports = router;
