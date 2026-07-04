import React, { useState, useEffect } from 'react';
import GlassCard from '../layout/GlassCard';
import NewTaskForm from './NewTaskForm';
import { IconRenderer } from '../ui/Icons';

export default function DailyTasks({ tasks, setTasks, onTaskComplete }) {

  const [frictionTask, setFrictionTask] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [frictionReason, setFrictionReason] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    let timer;
    if (frictionTask && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [frictionTask, countdown]);

  useEffect(() => {
    // Fetch today's logs to initialize completion state
    if (tasks.length === 0) return;
    const fetchLogs = async () => {
      try {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const res = await fetch(`/api/habit-logs?dateString=${todayStr}&_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        const data = await res.json();
        if (data.success) {
          const completedIds = data.data
            .filter(log => log.status === 'completed')
            .map(log => String(log.habitId));
            
          setTasks(prevTasks => prevTasks.map(t => ({
            ...t,
            completed: completedIds.includes(String(t._id || t.id))
          })));
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };
    fetchLogs();
  }, [tasks.length]); // Re-run when tasks array length changes (e.g. after initial load or add)

  const toggleTask = async (id) => {
    const taskToToggle = tasks.find(t => (t._id || t.id) === id);
    if (!taskToToggle) return;
    
    // Guard against toggling if locked
    if (taskToToggle.dependsOn) {
      const parentTask = tasks.find(t => (t._id || t.id) === taskToToggle.dependsOn);
      if (parentTask && !parentTask.completed) return;
    }

    // Negative habit friction
    if (taskToToggle.type === 'negative' && !taskToToggle.completed) {
      setFrictionTask(taskToToggle);
      setCountdown(10);
      setFrictionReason('');
      return;
    }

    // Update local state optimistically
    setTasks(tasks.map(task => {
      if ((task._id || task.id) === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    }));

    const todayStr = new Date().toLocaleDateString('en-CA');
    
    try {
      if (taskToToggle.completed) {
        // Undo completion
        await fetch('/api/habit-logs', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habitId: id, dateString: todayStr })
        });
      } else {
        // Complete task
        await fetch('/api/habit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habitId: id, status: 'completed', dateString: todayStr })
        });
        if (onTaskComplete) onTaskComplete();
      }
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      setTasks(tasks.map(task => {
        if ((task._id || task.id) === id) {
          return { ...task, completed: taskToToggle.completed };
        }
        return task;
      }));
    }
  };

  const handleConfirmFailure = async () => {
    if (countdown === 0 && frictionReason.trim().length >= 10) {
      const todayStr = new Date().toLocaleDateString('en-CA');
      
      try {
        await fetch('/api/habit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            habitId: frictionTask._id, 
            status: 'completed', 
            dateString: todayStr,
            mood: 'bad' // Could be dynamic, but setting to bad for negative friction failure
          })
        });

        setTasks(tasks.map(task => 
          task._id === frictionTask._id ? { ...task, completed: true } : task
        ));
        setFrictionTask(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.filter(task => task._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <GlassCard className="lg:col-span-3">
      <h2 className="text-lg font-semibold mb-4">Today's Tasks</h2>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => {
          const taskId = task._id || task.id;
          let isLocked = false;
          if (task.dependsOn) {
            const parentTask = tasks.find(t => (t._id || t.id) === task.dependsOn);
            if (parentTask && !parentTask.completed) {
              isLocked = true;
            }
          }

          return (
          <div 
            key={taskId} 
            className={`group p-4 rounded-xl border transition-all duration-500 flex items-center justify-between
              ${task.completed 
                ? 'bg-surface-800/10 border-white/5 opacity-50' 
                : isLocked
                  ? 'bg-surface-900/30 border-white/5 opacity-40 grayscale pointer-events-none'
                  : 'bg-surface-800/30 hover:bg-surface-800/60 border-white/10'}`}
          >
            <div className={`flex items-center gap-4 flex-1 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => toggleTask(taskId)}>
              {/* Custom Checkbox */}
              <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors duration-300 relative
                ${task.completed 
                   ? (task.type === 'negative' ? 'bg-red-500/80 border-red-500' : 'bg-primary border-primary') 
                   : 'bg-surface-900/50 border-white/20 group-hover:border-primary/50'}`}>
                {task.completed && (
                  <svg className="w-4 h-4 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isLocked && !task.completed && (
                   <svg className="w-3.5 h-3.5 text-gray-500 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                )}
              </div>
              
              {/* Task Icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-surface-900/50 border border-white/10 ${task.completed ? 'opacity-50 grayscale text-gray-500' : 'text-primary shadow-[0_0_10px_rgba(var(--color-primary),0.2)]'}`}>
                 <IconRenderer iconName={task.icon || 'star'} className="w-4 h-4" />
              </div>
              
              {/* Task Name with smooth strikethrough */}
              <span className={`font-medium text-lg transition-all duration-500 relative
                ${task.completed 
                  ? (task.type === 'negative' ? 'text-red-400/50' : 'text-gray-500') 
                  : 'text-gray-200'}`}
              >
                {task.name}
                <span className={`absolute left-0 top-1/2 h-[2px] transition-all duration-500 -translate-y-1/2
                  ${task.type === 'negative' ? 'bg-red-500/50' : 'bg-gray-500'}
                  ${task.completed ? 'w-full' : 'w-0'}`} 
                />
              </span>
            </div>
            
            {/* Action Buttons (Modify/Delete) */}
            <div className={`flex gap-2 transition-opacity duration-300 ${task.completed || isLocked ? 'opacity-0 pointer-events-none' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                className="p-2 text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title="Modify Task"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteTask(taskId); }}
                className="p-2 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition"
                title="Delete Task"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tasks for today. You're all caught up!
          </div>
        )}
      </div>

      {/* Friction Modal */}
      {frictionTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-900 border border-red-500/20 p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-4 mx-auto border border-red-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Breaking a Habit?</h3>
            <p className="text-gray-400 text-center mb-6 text-sm">
              You are about to record a failure for <strong className="text-red-400">{frictionTask.name}</strong>. Take a moment to reflect. Why is this happening?
            </p>
            
            <textarea
              value={frictionReason}
              onChange={(e) => setFrictionReason(e.target.value)}
              placeholder="I am breaking this habit because... (min 10 characters)"
              className="w-full bg-surface-950 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500/50 transition-colors resize-none h-24 mb-6"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setFrictionTask(null)}
                className="flex-1 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-lg text-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmFailure}
                disabled={countdown > 0 || frictionReason.trim().length < 10}
                className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all
                  ${countdown > 0 || frictionReason.trim().length < 10 
                    ? 'bg-surface-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}
              >
                {countdown > 0 ? `Wait ${countdown}s` : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-4">
          <div className="bg-surface-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-auto max-h-[90vh] flex flex-col">
            {/* Header - Fixed */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-white/10 shrink-0">
              <h3 className="text-xl font-bold">Edit Task</h3>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors hover:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Body - Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <NewTaskForm 
                initialData={editingTask}
                onCancel={() => setEditingTask(null)}
                onTaskUpdated={(updatedTask) => {
                  setTasks(tasks.map(t => (t._id || t.id) === updatedTask._id ? { ...t, ...updatedTask } : t));
                  setEditingTask(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
