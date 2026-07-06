import { useEffect } from 'react';

// Utility to convert Base64 string to Uint8Array for pushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function useNotifications(habits) {
  useEffect(() => {
    // 1. Setup Web Push for background notifications
    async function setupPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
      }
      
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Fallback to the generated key if env variable is missing
          const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || import.meta.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BJThL_CcaZt7pAnPpHkRGQ4IDJXehD-H244faEvvHvV5drsIRS0npf8Qu1K2WnIV1TaNee1MFwQCUaXcvQffztg";
          
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }
        
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
      } catch (err) {
        console.error('Failed to setup push notifications:', err);
      }
    }
    
    setupPush();

    // 2. Local exact-time notifications when app is open
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const checkSchedules = () => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const todayStr = now.toLocaleDateString('en-CA');

      habits.forEach(habit => {
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

        const notificationTimes = [
          { mins: scheduledMins - 30, type: 'upcoming' },
          { mins: scheduledMins, type: 'now' }
        ];

        notificationTimes.forEach(({ mins, type }) => {
          if (mins < 0) return;

          const storageKey = `notified_local_${habit._id}_${todayStr}_${type}`;
          if (localStorage.getItem(storageKey) === 'true') return;

          if (currentMins === mins) {
            const messageBody = type === 'upcoming' 
              ? `${habit.name} is scheduled in 30 minutes!` 
              : `It's time to work on: ${habit.name}`;
            
            new Notification("Habit Reminder", {
              body: messageBody,
              icon: '/favicon.png'
            });
            localStorage.setItem(storageKey, 'true');
          } else if (currentMins > mins) {
            // Missed local exact time, don't spam
            localStorage.setItem(storageKey, 'true');
          }
        });
      });
    };

    const intervalId = setInterval(checkSchedules, 60000);
    checkSchedules();

    return () => clearInterval(intervalId);
  }, [habits]);
}
