import dbConnect from '../_utils/dbConnect.js';
import HabitLog from '../_models/HabitLog.js';
import Habit from '../_models/Habit.js'; // Needed to register the model for populate
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const cookies = cookie.parseCookie(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) throw new Error('Not authenticated');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_antigravity');
    const userId = decoded.userId;

    await dbConnect();

    // Fetch the 100 most recent completed habit logs
    const history = await HabitLog.find({ userId, status: 'completed' })
      .sort({ loggedAt: -1 })
      .limit(100)
      .populate('habitId', 'name icon category');

    res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error("History API error:", error);
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}
