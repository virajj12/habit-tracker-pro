import dbConnect from '../_utils/dbConnect.js';
import HabitLog from '../_models/HabitLog.js';
import Habit from '../_models/Habit.js';
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

    // 3. Current Streak (Highest streak out of all individual tasks, ignoring their skip days)
    const habits = await Habit.find({ userId });
    const completedLogs = await HabitLog.find({ userId, status: 'completed' });
    
    // Group completed logs by habitId
    const logsByHabit = {};
    for (const log of completedLogs) {
      const hId = log.habitId.toString();
      if (!logsByHabit[hId]) logsByHabit[hId] = [];
      logsByHabit[hId].push(log.dateString);
    }
    
    let currentStreak = 0;
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (const habit of habits) {
      const hId = habit._id.toString();
      const skipDays = habit.skipDays || [];
      const datesCompleted = logsByHabit[hId] || [];
      const datesCompletedSet = new Set(datesCompleted);
      
      let habitStreak = 0;
      let expectedDate = new Date(today);
      
      // Look back up to 5 years to find the streak
      for (let i = 0; i < 1825; i++) {
        const dStr = expectedDate.toLocaleDateString('en-CA');
        const dayName = dayNames[expectedDate.getDay()];
        
        if (datesCompletedSet.has(dStr)) {
          habitStreak++;
        } else if (skipDays.includes(dayName)) {
          // It's a skip day and not completed, so don't break the streak
        } else if (dStr === todayStr) {
          // Today is not completed and not a skip day. Allow streak to continue from yesterday.
        } else {
          // Not completed, not a skip day, not today -> streak breaks
          break;
        }
        
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
      
      if (habitStreak > currentStreak) {
        currentStreak = habitStreak;
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
