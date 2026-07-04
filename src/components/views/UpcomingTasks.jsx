import React, { useState, useEffect } from 'react';
import GlassCard from '../layout/GlassCard';
import { IconRenderer } from '../ui/Icons';

export default function UpcomingTasks({ tasks = [] }) {
  const [currentTask, setCurrentTask] = useState(null);
  const [nextTask, setNextTask] = useState(null);

  useEffect(() => {
    const updateTasks = () => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      let current = null;
      let upcoming = null;

      const agenda = tasks
        // Filter out completed tasks and tasks without valid schedules
        .filter(t => !t.completed && t.scheduledTime && (t.scheduledTime.timeOption === 'fixed' || t.scheduledTime.timeOption === 'range'))
        .map(t => {
          let startMins = null;
          let endMins = null;
          
          if (t.scheduledTime.timeOption === 'fixed' && t.scheduledTime.fixedTime) {
            const [h, m] = t.scheduledTime.fixedTime.split(':').map(Number);
            startMins = h * 60 + m;
            endMins = startMins + 60; // Give fixed tasks a 1-hour active window
          } else if (t.scheduledTime.timeOption === 'range' && t.scheduledTime.timeRangeStart) {
            const [h1, m1] = t.scheduledTime.timeRangeStart.split(':').map(Number);
            startMins = h1 * 60 + m1;
            if (t.scheduledTime.timeRangeEnd) {
              const [h2, m2] = t.scheduledTime.timeRangeEnd.split(':').map(Number);
              endMins = h2 * 60 + m2;
              if (endMins < startMins) endMins += 24 * 60; // Handle overnight ranges
            } else {
              endMins = startMins + 60; // Fallback if no end time
            }
          }
          
          return { ...t, startMins, endMins };
        })
        .filter(t => t.startMins !== null)
        .sort((a, b) => a.startMins - b.startMins);

      for (const task of agenda) {
        // Handle overnight wrap-around for current time check
        const isCurrent = (currentMins >= task.startMins && currentMins < task.endMins) || 
                          (task.endMins > 1440 && currentMins < task.endMins - 1440);
                          
        if (!current && isCurrent) {
          current = task;
        } 
        // Find first upcoming task that is strictly in the future
        else if (!upcoming && !isCurrent && task.startMins > currentMins) {
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
  }, [tasks]);

  const renderTime = (task) => {
    if (task.scheduledTime.timeOption === 'range') {
      return `${task.scheduledTime.timeRangeStart} - ${task.scheduledTime.timeRangeEnd || '?'}`;
    }
    return task.scheduledTime.fixedTime;
  };

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
              <div className="text-xl font-medium text-white flex items-center gap-2">
                {currentTask && <IconRenderer iconName={currentTask.icon || 'star'} className="w-5 h-5 text-primary" />}
                {currentTask ? currentTask.name : 'Free Time!'}
              </div>
            </div>
            {currentTask && (
              <div className="text-sm text-primary font-semibold bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                {renderTime(currentTask)}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Task Reminder */}
        <div className="p-4 bg-surface-800/30 border border-white/10 rounded-xl relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500 font-bold tracking-wider mb-1 uppercase">Up Next</div>
              <div className="text-lg font-medium text-gray-200 flex items-center gap-2">
                {nextTask && <IconRenderer iconName={nextTask.icon || 'star'} className="w-4 h-4 text-secondary" />}
                {nextTask ? nextTask.name : 'No more tasks today!'}
              </div>
            </div>
            {nextTask && (
              <div className="text-sm text-secondary font-semibold bg-secondary/10 px-3 py-1 rounded-lg border border-secondary/20">
                {renderTime(nextTask)}
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
