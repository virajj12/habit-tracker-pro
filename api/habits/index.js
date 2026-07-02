import dbConnect from '../_utils/dbConnect.js';
import Habit from '../_models/Habit.js';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

export default async function handler(req, res) {
  const { method } = req;

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

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const habits = await Habit.find({ userId, isVisible: { $ne: false } }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: habits });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    case 'POST':
      try {
        const habit = await Habit.create({ ...req.body, userId });
        res.status(201).json({ success: true, data: habit });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
      break;
  }
}
