const { verifyToken } = require('../utils/jwt'); // make sure you have a jwt.js util

// Authenticate user by verifying JWT token
exports.authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = verifyToken(token); // will throw if invalid
    // decoded should contain user info like id, role, email, etc.
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.authorizeRole = (...roles) => (req, res, next) => {
  // FIX: Flatten the roles array to handle cases where it's passed as an array
  // Example: authorizeRole('doctor') => ['doctor']
  // Example: authorizeRole(['doctor', 'patient']) => ['doctor', 'patient']
  const allowedRoles = roles.flat(); 
  console.log(allowedRoles)

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Authorize based on user roles
// exports.authorizeRole = (...roles) => (req, res, next) => {
//   if (!req.user || !roles.includes(req.user.role)) {
//     return res.status(403).json({ message: 'Access denied' });
//   }
//   next();
// };
