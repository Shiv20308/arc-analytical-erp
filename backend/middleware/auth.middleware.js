const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ─── JWT Authentication Middleware ────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
};

// ─── Role-Based Access Control ────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

// ─── Admin only ───────────────────────────────────────────────────────────────
const adminOnly = authorize('admin');

module.exports = { protect, authorize, adminOnly };
