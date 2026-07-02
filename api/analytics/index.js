import dbConnect from '../_utils/dbConnect.js';
import HabitLog from '../_models/HabitLog.js';
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

    // 1. Total Tasks Done
    const totalTasksDone = await HabitLog.countDocuments({ userId, status: 'completed' });

    // 2. Completion Rate (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA');
    
    const recentLogs = await HabitLog.find({ 
      userId, 
      dateString: { $gte: thirtyDaysAgoStr }
    });

    const recentCompleted = recentLogs.filter(log => log.status === 'completed').length;
    // We assume any log (completed or skipped) is an expected task. 
    // If no logs, rate is 0. If there are logs, it's completed / total logs.
    const completionRate = recentLogs.length > 0 ? Math.round((recentCompleted / recentLogs.length) * 100) : 0;

    // 3. Current Streak (Days in a row with at least 1 completed task)
    // Get all unique dates with a completion, sorted descending
    const completedDates = await HabitLog.distinct('dateString', { userId, status: 'completed' });
    completedDates.sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA');
    
    let expectedDateStr = todayStr;
    let expectedDate = new Date(today);

    // If they haven't done anything today yet, the streak could still be active from yesterday
    if (completedDates.length > 0 && completedDates[0] !== todayStr) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      expectedDateStr = expectedDate.toLocaleDateString('en-CA');
    }

    for (let dateStr of completedDates) {
      if (dateStr === expectedDateStr) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
        expectedDateStr = expectedDate.toLocaleDateString('en-CA');
      } else {
        break;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalTasksDone,
        completionRate,
        currentStreak
      }
    });

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}
