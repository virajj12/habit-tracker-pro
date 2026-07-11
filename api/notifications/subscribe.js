import dbConnect from '../_utils/dbConnect.js';
import User from '../_models/User.js';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let userId;
  try {
    const cookies = cookie.parseCookie(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) throw new Error('Not authenticated');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_antigravity');
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    const { subscription, timezoneOffset } = req.body;
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Missing subscription' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update timezone offset if provided
    if (typeof timezoneOffset === 'number') {
      user.timezoneOffset = timezoneOffset;
    }

    // Check if subscription already exists
    const subExists = user.pushSubscriptions && user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!subExists) {
      if (!user.pushSubscriptions) user.pushSubscriptions = [];
      user.pushSubscriptions.push(subscription);
    }
    
    await user.save();

    res.status(200).json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error("Subscribe Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
