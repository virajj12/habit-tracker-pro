import dbConnect from '../../_utils/dbConnect.js';
import HabitLog from '../../_models/HabitLog.js';
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
        const { dateString, startDate, endDate } = req.query;
        let filter = { userId };
        
        if (dateString) {
          filter.dateString = dateString;
        } else if (startDate && endDate) {
          filter.dateString = { $gte: startDate, $lte: endDate };
        }
        
        const logs = await HabitLog.find(filter);
        res.status(200).json({ success: true, data: logs });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        const { habitId, status, dateString, mood } = req.body;
        
        // Upsert the log for this specific date and habit
        const log = await HabitLog.findOneAndUpdate(
          { userId, habitId, dateString },
          { status, mood, completionTime: Date.now() },
          { new: true, upsert: true, runValidators: true }
        );
        
        res.status(201).json({ success: true, data: log });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    
    case 'DELETE':
      // Used to undo a completion
      try {
        const { habitId, dateString } = req.body;
        const deleted = await HabitLog.findOneAndDelete({ userId, habitId, dateString });
        if (!deleted) {
          return res.status(404).json({ success: false, message: 'Log not found' });
        }
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
      break;
  }
}
