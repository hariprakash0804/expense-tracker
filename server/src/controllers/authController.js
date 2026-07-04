const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenHelpers');

// Register a new user
const register = async (req, res, next) => {
  try {
    const { name, email, password, currency } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password hashed by model hook)
    const user = await User.create({ name, email, password, currency });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: user.toJSON(),
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: user.toJSON(),
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token
const refreshAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided.',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    
    // Find user and verify stored token matches
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
      });
    }

    // Generate new tokens (rotation)
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update stored refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.',
    });
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Find user and clear refresh token
      try {
        const decoded = verifyRefreshToken(token);
        const user = await User.findByPk(decoded.id);
        if (user) {
          user.refreshToken = null;
          await user.save();
        }
      } catch (e) {
        // Token might be expired or invalid, that's fine for logout
      }
    }

    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

// Update profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, currency, theme } = req.body;
    const user = await User.findByPk(req.user.id);

    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (theme) user.theme = theme;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Update password (hashed by model hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};
