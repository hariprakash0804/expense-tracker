const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../schemas');
const {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// Public routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
