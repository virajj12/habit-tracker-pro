import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import dbConnect from '../../_utils/dbConnect.js';
import Habit from '../../_models/Habit.js';
import HabitLog from '../../_models/HabitLog.js';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

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
        const habit = await Habit.findOne({ _id: id, userId });
        if (!habit) {
          return res.status(404).json({ success: false, message: 'Habit not found' });
        }
        res.status(200).json({ success: true, data: habit });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {
        const habit = await Habit.findOneAndUpdate({ _id: id, userId }, req.body, {
          new: true,
          runValidators: true,
        });
        if (!habit) {
          return res.status(404).json({ success: false, message: 'Habit not found' });
        }
        res.status(200).json({ success: true, data: habit });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const deletedHabit = await Habit.findOneAndUpdate(
          { _id: id, userId },
          { isVisible: false },
          { new: true }
        );
        if (!deletedHabit) {
          return res.status(404).json({ success: false, message: 'Habit not found' });
        }
        
        // DO NOT delete associated logs for soft-deleted habits, to preserve historical stats!
        // await HabitLog.deleteMany({ habitId: id });
        
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
      break;
  }
}
