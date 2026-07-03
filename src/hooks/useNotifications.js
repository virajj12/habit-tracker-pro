import { useEffect } from 'react';

export default function useNotifications(habits) {
  useEffect(() => {
    // Only proceed if browser supports notifications and permission is granted
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const checkSchedules = () => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

      habits.forEach(habit => {
        // Only consider incomplete habits with a scheduled time
        if (habit.completed || !habit.scheduledTime) return;

        let shouldNotify = false;
        let scheduledMins = null;
        
        if (habit.scheduledTime.timeOption === 'fixed' && habit.scheduledTime.fixedTime) {
          const [h, m] = habit.scheduledTime.fixedTime.split(':').map(Number);
          scheduledMins = h * 60 + m;
        } else if (habit.scheduledTime.timeOption === 'range' && habit.scheduledTime.timeRangeStart) {
          const [h, m] = habit.scheduledTime.timeRangeStart.split(':').map(Number);
          scheduledMins = h * 60 + m;
        }

        if (scheduledMins !== null && currentMins >= scheduledMins) {
          shouldNotify = true;
        }

        if (shouldNotify) {
          // Check localStorage to ensure we don't notify multiple times for the same habit today
          const storageKey = `notified_${habit._id}_${todayStr}`;
          if (!localStorage.getItem(storageKey)) {
            // Trigger notification
            new Notification("Time for your habit!", {
              body: `It's time to work on: ${habit.name}`,
              icon: '/favicon.png'
            });
            // Mark as notified for today
            localStorage.setItem(storageKey, 'true');
          }
        }
      });
    };

    // Run the check every 60 seconds
    const intervalId = setInterval(checkSchedules, 60000);
    
    // Also run an initial check right away in case we load the app right on the minute
    checkSchedules();

    return () => clearInterval(intervalId);
  }, [habits]);
}
