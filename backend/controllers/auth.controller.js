const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { apiResponse } = require('../utils/helpers');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return apiResponse(res, 400, false, 'Email and password are required');
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) return apiResponse(res, 401, false, 'Invalid credentials');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return apiResponse(res, 401, false, 'Invalid credentials');
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = signToken(user._id);
    apiResponse(res, 200, true, 'Login successful', { token, user: user.toJSON() });
  } catch (err) { apiResponse(res, 500, false, err.message); }
};

// POST /api/auth/signup  — public self-registration (creates as 'sales' role by default)
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, company } = req.body;
    if (!name || !email || !password) return apiResponse(res, 400, false, 'Name, email and password are required');
    if (password.length < 6) return apiResponse(res, 400, false, 'Password must be at least 6 characters');

    const existingUser = await User.findOne({ email });
    if (existingUser) return apiResponse(res, 400, false, 'Email already registered');

    // First user ever gets admin role automatically
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'sales';

    const user = await User.create({ name, email, password, role, phone: phone || '', company: company || '' });
    const token = signToken(user._id);
    apiResponse(res, 201, true, 'Account created successfully', { token, user: user.toJSON() });
  } catch (err) { apiResponse(res, 500, false, err.message); }
};

// POST /api/auth/register — admin-only creates users with any role
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return apiResponse(res, 400, false, 'Email already registered');
    const user = await User.create({ name, email, password, role: role || 'sales', phone });
    const token = signToken(user._id);
    apiResponse(res, 201, true, 'User registered successfully', { token, user: user.toJSON() });
  } catch (err) { apiResponse(res, 500, false, err.message); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => { apiResponse(res, 200, true, 'User profile', req.user); };

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return apiResponse(res, 400, false, 'New password must be at least 6 characters');
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return apiResponse(res, 400, false, 'Current password is incorrect');
    user.password = newPassword;
    await user.save();
    apiResponse(res, 200, true, 'Password changed successfully');
  } catch (err) { apiResponse(res, 500, false, err.message); }
};
