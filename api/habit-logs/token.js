import dbConnect from '../../_utils/dbConnect.js';
import HabitLog from '../../_models/HabitLog.js';
import Habit from '../../_models/Habit.js';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const cookies = cookie.parseCookie(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) throw new Error('Not authenticated');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_antigravity');
    const userId = decoded.userId;

    await dbConnect();

    const { dateString } = req.body;
    
    if (!dateString) {
      return res.status(400).json({ success: false, message: 'dateString is required' });
    }

    // Since we don't have a specific habit to attach the token to, 
    // we'll just create a dummy log for that date with status 'skipped-token'.
    // Alternatively, we could create a log for all habits that day, but a single dummy log is enough for the heatmap.
    // For simplicity, we just use a null habitId (which violates the schema if required).
    // Let's check HabitLog schema. It says habitId is required. 
    // Instead of a dummy log, let's just find one of the user's habits to attach it to, or create a 'system' habit.
    // Easiest is to just fetch the user's oldest habit and attach it there.
    
    const userHabits = await Habit.find({ userId }).limit(1);
    if (userHabits.length === 0) {
      return res.status(400).json({ success: false, message: 'No habits found to freeze' });
    }

    const log = await HabitLog.findOneAndUpdate(
      { userId, habitId: userHabits[0]._id, dateString },
      { status: 'skipped-token', completionTime: Date.now() },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: log });

  } catch (error) {
    console.error("Token error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
}
