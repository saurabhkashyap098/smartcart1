const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes – verify JWT
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized – no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'User belonging to this token no longer exists' });
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err); // Passes JsonWebTokenError / TokenExpiredError to errorHandler
  }
};

// Authorize by roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: role '${req.user.role}' cannot perform this action`,
      });
    }
    next();
  };
};
