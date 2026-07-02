import React, { useState, useEffect } from 'react';
import GlassCard from '../layout/GlassCard';
import Heatmap from './Heatmap';
import NewTaskForm from './NewTaskForm';
import UpcomingTasks from './UpcomingTasks';
import DailyTasks from './DailyTasks';
import useNotifications from '../../hooks/useNotifications';

export default function HomeView({ user }) {
  const [xp, setXp] = useState(user?.xp || 0);
  const [level, setLevel] = useState(user?.level || 1);
  const [habits, setHabits] = useState([]);
  
  // Start notification schedule watcher
  useNotifications(habits);

  useEffect(() => {
    fetch('/api/habits')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHabits(data.data);
        }
      })
      .catch(err => console.error("Error fetching habits:", err));
  }, []);
  
  const xpNextLevel = 100;
  const currentLevelXp = xp % xpNextLevel;
  const progressPercent = (currentLevelXp / xpNextLevel) * 100;

  const totalTasks = habits.length;
  const completedTasks = habits.filter(h => h.completed).length;
  const momentumPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleTaskComplete = async () => {
    let newXp = xp + 10;
    let newLevel = level;
    
    if (newXp % xpNextLevel === 0) {
      newLevel += 1; // Level up!
    }

    setXp(newXp);
    setLevel(newLevel);

    // Persist to backend
    try {
      await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: newXp, level: newLevel })
      });
    } catch (err) {
      console.error("Failed to save XP:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* RPG Gamification & Velocity Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 truncate">Hello, {user?.name || 'Pioneer'}!</h1>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-32 md:w-48 h-3 bg-surface-900 rounded-full overflow-hidden border border-white/5 relative shrink-0">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs md:text-sm text-gray-400 font-medium truncate">Lvl {level} <span className="text-gray-600">({currentLevelXp}/{xpNextLevel} XP)</span></span>
          </div>
        </div>

        {/* Velocity Score */}
        <div className="flex items-center gap-3 bg-surface-800/30 px-4 md:px-5 py-2 md:py-2.5 rounded-2xl border border-white/5 shadow-lg w-full md:w-auto">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shrink-0">
            <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">Velocity</div>
            <div className="text-base md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
              {momentumPercent}% Momentum
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Heatmap Section (Top Left) */}
      <GlassCard className="lg:col-span-2 flex flex-col">
        <Heatmap user={user} />
      </GlassCard>

      {/* New Task Form (Top Right, Spanning 2 rows) */}
      <GlassCard className="lg:col-span-1 lg:row-span-2">
        <h2 className="text-lg font-semibold mb-4">New Task</h2>
        <NewTaskForm onTaskAdded={(newTask) => setHabits(prev => [newTask, ...prev])} />
      </GlassCard>

      {/* Upcoming Tasks (Middle Left) */}
      <UpcomingTasks tasks={habits} />

      {/* Daily Tasks List (Bottom Full Width) */}
      <DailyTasks tasks={habits} setTasks={setHabits} onTaskComplete={handleTaskComplete} />

      </div>

    </div>
  );
}
