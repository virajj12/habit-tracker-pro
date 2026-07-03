import { useEffect } from 'react';

export default function useNotifications(habits) {
  useEffect(() => {
    // Only proceed if browser supports notifications and permission is granted
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const supportsTriggers = 'showTrigger' in Notification.prototype && 'serviceWorker' in navigator;

    const checkSchedules = async () => {
      let registration = null;
      if (supportsTriggers) {
        try {
          registration = await navigator.serviceWorker.ready;
        } catch (e) {
          console.error("SW not ready", e);
        }
      }

      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

      habits.forEach(habit => {
        // Only consider incomplete habits with a scheduled time
        if (habit.completed || !habit.scheduledTime) return;

        let scheduledMins = null;
        
        if (habit.scheduledTime.timeOption === 'fixed' && habit.scheduledTime.fixedTime) {
          const [h, m] = habit.scheduledTime.fixedTime.split(':').map(Number);
          scheduledMins = h * 60 + m;
        } else if (habit.scheduledTime.timeOption === 'range' && habit.scheduledTime.timeRangeStart) {
          const [h, m] = habit.scheduledTime.timeRangeStart.split(':').map(Number);
          scheduledMins = h * 60 + m;
        }

        if (scheduledMins === null) return;

        const storageKey = `notified_${habit._id}_${todayStr}`;
        const storageValue = localStorage.getItem(storageKey);
        const expectedScheduledVal = `scheduled_${scheduledMins}`;

        if (scheduledMins > currentMins) {
          // Future time: Schedule using Triggers API if supported
          if (supportsTriggers && registration && storageValue !== expectedScheduledVal && storageValue !== 'true') {
            const scheduledDate = new Date();
            scheduledDate.setHours(Math.floor(scheduledMins / 60), scheduledMins % 60, 0, 0);
            
            try {
              registration.showNotification("Time for your habit!", {
                body: `It's time to work on: ${habit.name}`,
                icon: '/favicon.png',
                tag: `habit_${habit._id}`,
                showTrigger: new window.TimestampTrigger(scheduledDate.getTime())
              });
              localStorage.setItem(storageKey, expectedScheduledVal);
            } catch (err) {
              console.error("Failed to schedule notification:", err);
            }
          }
        } else {
          // Past or present time: Fire immediate notification if not already fired
          if (storageValue !== 'true') {
            // If it was scheduled by SW, assume the OS already fired it. Just mark it as true.
            if (supportsTriggers && storageValue === expectedScheduledVal) {
              localStorage.setItem(storageKey, 'true');
            } else {
              new Notification("Time for your habit!", {
                body: `It's time to work on: ${habit.name}`,
                icon: '/favicon.png',
                tag: `habit_${habit._id}`
              });
              localStorage.setItem(storageKey, 'true');
            }
          }
        }
      });
    };

    // Run the check every 60 seconds
    const intervalId = setInterval(checkSchedules, 60000);
    
    // Also run an initial check right away
    checkSchedules();

    return () => clearInterval(intervalId);
  }, [habits]);
}
