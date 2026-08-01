const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Helper to send token response
const sendToken = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
    },
  });
};

// @desc   Register user
// @route  POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, phone });
    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc   Login user
// @route  POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc   Get current logged-in user
// @route  GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc   Update profile
// @route  PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc   Change password
// @route  PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc   Add address
// @route  POST /api/auth/address
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = req.body;

    if (address.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }

    user.addresses.push(address);
    await user.save();
    // Re-fetch to get full populated user (keeps checkout & profile in sync)
    const updated = await User.findById(req.user._id);
    res.status(200).json({ success: true, user: updated, addresses: updated.addresses });
  } catch (err) {
    next(err);
  }
};

// @desc   Update address
// @route  PUT /api/auth/address/:id
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    if (req.body.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }

    Object.assign(addr, req.body);
    await user.save();
    const updated = await User.findById(req.user._id);
    res.status(200).json({ success: true, user: updated, addresses: updated.addresses });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete address
// @route  DELETE /api/auth/address/:id
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    const updated = await User.findById(req.user._id);
    res.status(200).json({ success: true, user: updated, addresses: updated.addresses });
  } catch (err) {
    next(err);
  }
};

// @desc   Toggle wishlist
// @route  POST /api/auth/wishlist/:productId
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    const idx = user.wishlist.findIndex(id => id.toString() === productId);
    let added;
    if (idx === -1) {
      user.wishlist.push(productId);
      added = true;
    } else {
      user.wishlist.splice(idx, 1);
      added = false;
    }

    await user.save();
    res.status(200).json({ success: true, added, wishlistCount: user.wishlist.length });
  } catch (err) {
    next(err);
  }
};

// @desc   Get wishlist
// @route  GET /api/auth/wishlist
exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    next(err);
  }
};

// @desc   Forgot password – send reset email
// @route  POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${resetToken}`;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"SmartCart" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: 'SmartCart — Password Reset Link',
        html: `
          <div style="font-family:Roboto,sans-serif;max-width:480px;margin:auto;padding:32px;background:#fff;border-radius:8px">
            <h2 style="color:#2874f0;margin-bottom:8px">Reset Your Password</h2>
            <p style="color:#555;line-height:1.6">Click the button below to reset your SmartCart password. This link expires in <strong>15 minutes</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#fb641b;color:#fff;border-radius:4px;text-decoration:none;font-weight:700">Reset Password</a>
            <p style="color:#999;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Try again later.' });
    }

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    next(err);
  }
};

// @desc   Reset password
// @route  PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc   Get all users (admin)
// @route  GET /api/auth/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @desc   Toggle user active status (admin)
// @route  PUT /api/auth/users/:id/toggle
exports.toggleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    next(err);
  }
};
