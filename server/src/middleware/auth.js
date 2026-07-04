const { verifyAccessToken } = require('../utils/tokenHelpers');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

module.exports = { authenticate };
