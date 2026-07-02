import { useEffect } from 'react';

export default function useNotifications(habits) {
  useEffect(() => {
    // Only proceed if browser supports notifications and permission is granted
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const checkSchedules = () => {
      const now = new Date();
      // Format current time as HH:MM
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      
      const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

      habits.forEach(habit => {
        // Only consider incomplete habits with a scheduled time
        if (habit.completed || !habit.scheduledTime) return;

        let shouldNotify = false;
        
        if (habit.scheduledTime.timeOption === 'fixed' && habit.scheduledTime.fixedTime === currentTimeStr) {
          shouldNotify = true;
        } else if (habit.scheduledTime.timeOption === 'range' && habit.scheduledTime.timeRangeStart === currentTimeStr) {
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
