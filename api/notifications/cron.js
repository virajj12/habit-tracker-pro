import dbConnect from '../_utils/dbConnect.js';
import User from '../_models/User.js';
import Habit from '../_models/Habit.js';
import HabitLog from '../_models/HabitLog.js';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // Only allow GET/POST for the cron ping
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Optional: add a secret key check so arbitrary users can't trigger this endlessly
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  try {
    await dbConnect();
    
    // Calculate current time window
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.toLocaleDateString('en-CA');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayStr = dayNames[now.getDay()];

    const users = await User.find({ pushSubscriptions: { $exists: true, $not: { $size: 0 } } });
    
    let notificationsSent = 0;

    for (const user of users) {
      // Find active habits for this user
      const habits = await Habit.find({ userId: user._id, isVisible: { $ne: false } });
      
      for (const habit of habits) {
        // Skip if it's a skip day
        if (habit.skipDays && habit.skipDays.includes(currentDayStr)) continue;
        
        // Skip if it has no scheduled time
        if (!habit.scheduledTime || habit.scheduledTime.timeOption === 'any') continue;

        let scheduledMins = null;
        if (habit.scheduledTime.timeOption === 'fixed' && habit.scheduledTime.fixedTime) {
          const [h, m] = habit.scheduledTime.fixedTime.split(':').map(Number);
          scheduledMins = h * 60 + m;
        } else if (habit.scheduledTime.timeOption === 'range' && habit.scheduledTime.timeRangeStart) {
          const [h, m] = habit.scheduledTime.timeRangeStart.split(':').map(Number);
          scheduledMins = h * 60 + m;
        }

        if (scheduledMins === null) continue;

        // Check if the habit is already completed today
        const log = await HabitLog.findOne({ userId: user._id, habitId: habit._id, dateString: todayStr });
        if (log && log.status === 'completed') continue;

        // Determine if we are within the notification window (e.g. exactly at time, or within a 15 min buffer)
        // Since cron jobs might run every 15 mins, we check if the scheduled time falls between now and now - 15 mins
        // Or if it's 30 mins before.
        const isTimeNow = currentMins >= scheduledMins && currentMins < scheduledMins + 15;
        const isTimeUpcoming = currentMins >= scheduledMins - 30 && currentMins < scheduledMins - 15;

        let message = null;
        if (isTimeNow) {
          message = `It's time to work on: ${habit.name}`;
        } else if (isTimeUpcoming) {
          message = `${habit.name} is scheduled in 30 minutes!`;
        }

        if (message) {
          const payload = JSON.stringify({
            title: 'Habit Reminder',
            body: message,
            icon: '/favicon.png',
            url: '/'
          });

          // Send to all subscriptions
          for (let i = 0; i < user.pushSubscriptions.length; i++) {
            const sub = user.pushSubscriptions[i];
            try {
              await webpush.sendNotification(sub, payload);
              notificationsSent++;
            } catch (err) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                // Subscription is expired or invalid, remove it
                user.pushSubscriptions.splice(i, 1);
                i--;
              } else {
                console.error("Push Error:", err);
              }
            }
          }
        }
      }
      
      // Save user if subscriptions were modified
      await user.save();
    }

    res.status(200).json({ success: true, notificationsSent });
  } catch (error) {
    console.error("Cron Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
