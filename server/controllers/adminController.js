const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const Product = require('../models/Product');
const Booking = require('../models/Booking');

// Get overall platform stats
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFarmers,
      totalAdmins,
      totalFarms,
      totalCrops,
      totalProducts,
      totalBookings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'admin' }),
      Farm.countDocuments(),
      Crop.countDocuments(),
      Product.countDocuments(),
      Booking.countDocuments()
    ]);

    // Active pest & disease alerts
    const activeAlertsCount = await Crop.countDocuments({
      $or: [{ pestAlert: true }, { diseaseAlert: true }]
    });

    // Total booking volume & revenue
    const revenueAgg = await Booking.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.json({
      totalUsers,
      totalFarmers,
      totalAdmins,
      totalFarms,
      totalCrops,
      activeAlertsCount,
      totalProducts,
      totalBookings,
      totalRevenue
    });
  } catch (error) {
    console.error('Error fetching admin platform stats:', error);
    res.status(500).json({ message: 'Failed to retrieve platform statistics' });
  }
};

// Get all registered users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    // Populate user counts
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const [farmCount, productCount, bookingCount] = await Promise.all([
          Farm.countDocuments({ farmer: u._id }),
          Product.countDocuments({ seller: u._id }),
          Booking.countDocuments({ farmer: u._id })
        ]);

        return {
          ...u.toObject(),
          farmCount,
          productCount,
          bookingCount
        };
      })
    );

    res.json(usersWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
};

// Update user role (e.g. promote to admin or demote)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['farmer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (String(req.params.id) === String(req.user.id) && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot revoke your own admin status' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { returnDocument: 'after', select: '-password' }
    );

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `Role updated to ${role}`, user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'Admins cannot delete their own account' });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cascade delete user's farms, crops, products
    const userFarms = await Farm.find({ farmer: req.params.id }).select('_id');
    const farmIds = userFarms.map(f => f._id);
    await Crop.deleteMany({ farm: { $in: farmIds } });
    await Farm.deleteMany({ farmer: req.params.id });
    await Product.deleteMany({ seller: req.params.id });

    res.json({ message: 'User and associated data removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get all bookings across the platform
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('farmer', 'name email')
      .populate('product', 'name price category seller')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve bookings' });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { returnDocument: 'after' }
    )
      .populate('farmer', 'name email')
      .populate('product', 'name price');

    if (!updated) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ message: `Status updated to ${status}`, booking: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update booking status' });
  }
};

// Get all farms across platform
exports.getAllFarms = async (req, res) => {
  try {
    const farms = await Farm.find()
      .populate('farmer', 'name email')
      .sort({ createdAt: -1 });

    res.json(farms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve farms' });
  }
};

// Get all crops across platform
exports.getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.find()
      .populate('farm', 'farmName location')
      .sort({ createdAt: -1 });

    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve crops' });
  }
};

// Delete a product (Admin moderation)
exports.deleteProductAsAdmin = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product removed by admin moderation' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

