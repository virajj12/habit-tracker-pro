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
        if (!("Notification" in window) || Notification.permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        
        // Use the environment variable, but ensure any accidental quotes are stripped
        let rawKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || import.meta.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BJThL_CcaZt7pAnPpHkRGQ4IDJXehD-H244faEvvHvV5drsIRS0npf8Qu1K2WnIV1TaNee1MFwQCUaXcvQffztg";
        const publicVapidKey = rawKey.replace(/^["']|["']$/g, '').trim();
        
        if (!subscription) {
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
          } catch (subscribeErr) {
            console.error('PushManager subscribe failed:', subscribeErr);
            if (subscribeErr.name === 'AbortError' || subscribeErr.message.includes('push service error')) {
              console.warn('Unregistering service worker to clear corrupted push state.');
              await registration.unregister();
              
              // Only reload once per session to prevent infinite reload loops in browsers
              // that permanently block push services (like Brave)
              if (!sessionStorage.getItem('push_reload_attempted')) {
                sessionStorage.setItem('push_reload_attempted', 'true');
                window.location.reload();
              } else {
                console.error('Push notifications are not supported or are blocked by this browser (e.g. Brave browser).');
              }
            }
            return; // Stop execution
          }
        } else {
          // If a subscription exists, it might be tied to an old key. 
          // PushManager doesn't easily let us read the old key to compare, 
          // so if backend fails to send notifications, the user would need to clear site data.
        }
        
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            subscription,
            timezoneOffset: new Date().getTimezoneOffset() 
          })
        });
      } catch (err) {
        console.error('Failed to setup push notifications:', err);
      }
    }
    
    setupPush();

    const handlePermissionGranted = () => {
      setupPush();
    };
    window.addEventListener('push_permission_granted', handlePermissionGranted);

    // 2. Local exact-time notifications when app is open
    const checkSchedules = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
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

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('push_permission_granted', handlePermissionGranted);
    };
  }, [habits]);
}
