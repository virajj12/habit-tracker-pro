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
    let token = cookies.auth_token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
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

    // 3. Current Streak (Global streak: consecutive days with at least one task completed)
    const habits = await Habit.find({ userId });
    const completedLogs = await HabitLog.find({ userId, status: 'completed' });
    const frozenLogs = await HabitLog.find({ userId, status: 'skipped-token' });

    const allCompletedDates = new Set(completedLogs.map(log => log.dateString));
    const allFrozenDates = new Set(frozenLogs.map(log => log.dateString));

    const today = new Date();
    let maxDateStr = today.toISOString().split('T')[0];
    for (const log of completedLogs) {
      if (log.dateString > maxDateStr) {
        maxDateStr = log.dateString;
      }
    }

    const activeHabits = habits.filter(h => h.isVisible !== false);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let earliestDateStr = null;
    if (activeHabits.length > 0) {
      const earliestDate = activeHabits.reduce((earliest, h) => {
        const d = (h.dateRange && h.dateRange.startDate) ? new Date(h.dateRange.startDate) : new Date(h.createdAt);
        return d < earliest ? d : earliest;
      }, new Date());
      // Apply a 1-day buffer to prevent timezone-related off-by-one errors (where local time is 1 day before UTC time)
      const adjustedEarliest = new Date(earliestDate.getTime() - 24 * 60 * 60 * 1000);
      earliestDateStr = adjustedEarliest.toISOString().split('T')[0];
    } else {
      // If no active habits, streak should just be 0 (no bridging)
      earliestDateStr = today.toISOString().split('T')[0];
    }

    const isNoTaskDay = (dStr, dayName) => {
      if (activeHabits.length === 0) return true;
      return activeHabits.every(h => {
        if ((h.skipDays || []).includes(dayName)) return true;
        
        const startDate = (h.dateRange && h.dateRange.startDate) ? new Date(h.dateRange.startDate) : new Date(h.createdAt);
        const adjustedStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // 1-day buffer
        const startStr = adjustedStartDate.toISOString().split('T')[0];
        if (dStr < startStr) return true;

        if (h.dateRange && h.dateRange.endDate) {
          const endDate = new Date(h.dateRange.endDate);
          const adjustedEndDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // 1-day buffer
          const endStr = adjustedEndDate.toISOString().split('T')[0];
          if (dStr > endStr) return true;
        }

        return false;
      });
    };

    let currentStreak = 0;
    // We use UTC parsing to cleanly subtract days without local timezone shifts
    let expectedDate = new Date(maxDateStr + 'T00:00:00Z');

    for (let i = 0; i < 1825; i++) {
      const dStr = expectedDate.toISOString().split('T')[0];
      const dayName = dayNames[expectedDate.getUTCDay()];

      if (allCompletedDates.has(dStr)) {
        currentStreak++;
      } else if (allFrozenDates.has(dStr) || isNoTaskDay(dStr, dayName)) {
        // Frozen day or no task on this day (skip day or before creation) -> doesn't increment streak, but doesn't break it
        // Prevent infinite bridging into the past by stopping before the oldest active habit started
        if (earliestDateStr && dStr < earliestDateStr) {
          break;
        }
      } else if (i === 0) {
        // If the very first day we check (maxDateStr) is not completed, 
        // it means maxDateStr is todayStr and it's not completed yet. Allow it.
      } else {
        break;
      }

      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    }

    // 4. Weekly Progress
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      let progressDate = new Date();
      progressDate.setDate(progressDate.getDate() - i);
      const dStr = progressDate.toLocaleDateString('en-CA');

      const completedOnDate = completedLogs.filter(log => log.dateString === dStr).length;
      weeklyProgress.push({
        date: progressDate.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: completedOnDate
      });
    }

    // 5. Habit Distribution
    const categoryCounts = {};
    for (const habit of habits) {
      if (habit.isVisible !== false) {
        const cat = habit.category || 'General';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }
    const habitDistribution = Object.keys(categoryCounts).map(key => ({
      name: key,
      value: categoryCounts[key]
    }));

    res.status(200).json({
      success: true,
      data: {
        totalTasksDone,
        completionRate,
        currentStreak,
        weeklyProgress,
        habitDistribution
      }
    });

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}
