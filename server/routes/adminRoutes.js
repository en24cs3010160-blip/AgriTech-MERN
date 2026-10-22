const express = require('express');
const router = express.Router();

const {
  getPlatformStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllBookings,
  updateBookingStatus,
  getAllFarms,
  getAllCrops,
  deleteProductAsAdmin
} = require('../controllers/adminController');

const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Protect all admin routes with authMiddleware AND adminMiddleware
router.use(authMiddleware);
router.use(adminMiddleware);

// Platform stats
router.get('/stats', getPlatformStats);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Booking management
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

// Platform monitoring
router.get('/farms', getAllFarms);
router.get('/crops', getAllCrops);

// Product moderation
router.delete('/products/:id', deleteProductAsAdmin);

module.exports = router;

