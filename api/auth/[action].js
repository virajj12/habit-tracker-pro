import dbConnect from '../_utils/dbConnect.js';
import User from '../_models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    await dbConnect();

    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'logout':
        return handleLogout(req, res);
      case 'signup':
        return await handleSignup(req, res);
      case 'me':
        return await handleMe(req, res);
      case 'forgot-password':
        return await handleForgotPassword(req, res);
      case 'reset-password':
        return await handleResetPassword(req, res);
      default:
        return res.status(404).json({ message: 'Not Found' });
    }
  } catch (error) {
    console.error(`Auth Error [${action}]:`, error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret_antigravity', { expiresIn: '7d' });
  const serialized = cookie.stringifySetCookie({
    name: 'auth_token', value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 60 * 60 * 24 * 7, path: '/'
  });
  res.setHeader('Set-Cookie', serialized);
  const userObj = user.toObject();
  delete userObj.password;
  res.status(200).json(userObj);
}

function handleLogout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const serialized = cookie.stringifySetCookie({
    name: 'auth_token', value: '', httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: -1, path: '/'
  });
  res.setHeader('Set-Cookie', serialized);
  res.status(200).json({ message: 'Logged out successfully' });
}

async function handleSignup(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'User already exists' });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  await User.create({ name, email, password: hashedPassword });
  res.status(201).json({ message: 'User created successfully' });
}

async function handleMe(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') return res.status(405).json({ message: 'Method Not Allowed' });
  const cookies = cookie.parseCookie(req.headers.cookie || '');
  const token = cookies.auth_token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_antigravity');
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  const user = await User.findById(decoded.userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (req.method === 'GET') {
    res.status(200).json(user);
  } else if (req.method === 'PUT') {
    const { xp, level, streakTokens } = req.body;
    if (xp !== undefined) user.xp = xp;
    if (level !== undefined) user.level = level;
    if (streakTokens !== undefined) user.streakTokens = streakTokens;
    await user.save();
    res.status(200).json(user);
  }
}

async function handleForgotPassword(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Please provide an email address.' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'No account with that email address exists.' });
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
  });
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = req.headers.host || process.env.VERCEL_URL || 'localhost:5173';
  const resetUrl = `${protocol}://${host}/?resetToken=${token}`;
  
  const mailOptions = {
    from: `"Habit Tracker" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Reset Your Password - Habit Tracker',
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
      `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
      `${resetUrl}\n\n` +
      `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f1115; color: #ffffff; padding: 40px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1d24; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.05);">
          <h1 style="color: #ef4444; margin-bottom: 8px; font-size: 28px; font-weight: bold;">Habit Tracker</h1>
          <p style="color: #9ca3af; font-size: 16px; margin-bottom: 32px;">Build unstoppable momentum.</p>
          <h2 style="font-size: 20px; margin-bottom: 16px; color: #ffffff;">Password Reset Request</h2>
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.5; margin-bottom: 32px; text-align: left;">
            We received a request to reset the password for your account. Click the button below to choose a new password. This link will expire in 1 hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; margin-bottom: 32px; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin-bottom: 16px; text-align: left;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #ef4444; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="color: #6b7280; font-size: 14px; text-align: left; margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px;">
            If you did not request a password reset, please safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
  res.status(200).json({ success: true, message: 'Password recovery email sent.' });
}

async function handleResetPassword(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password are required.' });
  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
}
