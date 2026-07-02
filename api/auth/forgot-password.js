import dbConnect from '../_utils/dbConnect.js';
import User from '../_models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return 404 per user request that it must exist
      return res.status(404).json({ success: false, message: 'No account with that email address exists.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // Set token and expiration (1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    // Create the reset URL based on the request origin
    // For Vercel Serverless Functions, we can construct it from headers
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
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}
