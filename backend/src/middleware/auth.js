const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET;
const SECRET = JWT_SECRET || 'your_super_secret_key';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required. Provide Bearer token.',
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await userService.getUserById(decoded.id);

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is inactive',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      message: 'Invalid or expired token',
    });
  }
};

module.exports = authMiddleware;
module.exports.verifyToken = authMiddleware;