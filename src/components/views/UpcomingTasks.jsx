import React, { useState, useEffect } from 'react';
import GlassCard from '../layout/GlassCard';

export default function UpcomingTasks() {
  const [currentTask, setCurrentTask] = useState(null);
  const [nextTask, setNextTask] = useState(null);

  useEffect(() => {
    const updateTasks = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

      let current = null;
      let upcoming = null;

      const mockAgenda = []; // Fetch from API in the future
      for (const task of mockAgenda) {
        if (currentTimeStr >= task.startTime && currentTimeStr < task.endTime) {
          current = task;
        } else if (task.startTime >= currentTimeStr && !upcoming) {
          upcoming = task;
        }
      }

      setCurrentTask(current);
      setNextTask(upcoming);
    };

    updateTasks();
    // Update every minute
    const interval = setInterval(updateTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="lg:col-span-2 flex flex-col justify-center">
      <h2 className="text-lg font-semibold mb-4">Reminders</h2>
      
      <div className="flex flex-col gap-4">
        {/* Current Task Reminder */}
        <div className="p-4 bg-primary/20 border border-primary/50 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="text-xs text-primary font-bold tracking-wider mb-1 uppercase animate-pulse">Right Now</div>
              <div className="text-xl font-medium text-white">{currentTask ? currentTask.name : 'Free Time!'}</div>
            </div>
            {currentTask && (
              <div className="text-sm text-primary font-semibold bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                {currentTask.startTime} - {currentTask.endTime}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Task Reminder */}
        <div className="p-4 bg-surface-800/30 border border-white/10 rounded-xl relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500 font-bold tracking-wider mb-1 uppercase">Up Next</div>
              <div className="text-lg font-medium text-gray-200">{nextTask ? nextTask.name : 'No more tasks today!'}</div>
            </div>
            {nextTask && (
              <div className="text-sm text-secondary font-semibold bg-secondary/10 px-3 py-1 rounded-lg border border-secondary/20">
                {nextTask.startTime}
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
