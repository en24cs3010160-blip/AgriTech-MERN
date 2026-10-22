const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication token required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: 'Server configuration error: JWT_SECRET missing'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Always attach decoded payload
    req.user = { id: decoded.id, role: decoded.role };

    // Fetch live user to prevent stale role elevation/revocation attacks
    const liveUser = await User.findById(decoded.id).select('-password');
    if (!liveUser) {
      return res.status(401).json({ message: 'User account no longer exists' });
    }

    // Keep live verified role
    req.user.role = liveUser.role;
    req.user.name = liveUser.name;
    req.user.email = liveUser.email;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied: Administrator privileges required'
    });
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: Requires one of [${roles.join(', ')}] role`
      });
    }
    next();
  };
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
module.exports.requireRole = requireRole;
