// src/middleware/authMiddleware.js
const { verifyToken } = require('../utils/jwt');

// Authenticate user from JWT in cookies (without querying DB)
exports.authenticate = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = verifyToken(token);
    req.user = decoded; // attach decoded payload directly
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Authorize roles based on decoded token info
exports.authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};
