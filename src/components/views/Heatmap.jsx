import React, { useState, useMemo, useEffect } from 'react';

// Helper to generate a range of dates
function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  // Ensure we start on a Sunday for the first week column
  currentDate.setDate(currentDate.getDate() - currentDate.getDay());
  
  const end = new Date(endDate);
  // Ensure we end on a Saturday for the last week column
  end.setDate(end.getDate() + (6 - end.getDay()));

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}



export default function Heatmap({ user }) {
  const [rangeOption, setRangeOption] = useState('month');
  
  // Gamification state
  const [tokens, setTokens] = useState(user?.streakTokens || 3);
  const [tokenDays, setTokenDays] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [targetDate, setTargetDate] = useState(null);
  
  const [habitLogs, setHabitLogs] = useState({});

  // Calculate Start and End Dates based on the selected option
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    if (rangeOption === 'month') {
      start.setDate(1); // First day of current month
      end.setMonth(end.getMonth() + 1, 0); // Last day of current month
    } else if (rangeOption === '3months') {
      start.setMonth(start.getMonth() - 3);
    } else if (rangeOption === '6months') {
      start.setMonth(start.getMonth() - 6);
    } else if (rangeOption === 'lifetime') {
      start.setFullYear(start.getFullYear() - 1); // Mock lifetime as 1 year for display
    }

    return { startDate: start, endDate: end };
  }, [rangeOption]);

  const dates = useMemo(() => getDatesInRange(startDate, endDate), [startDate, endDate]);
  
  useEffect(() => {
    // Fetch habit logs for this date range
    const startStr = startDate.toLocaleDateString('en-CA');
    const endStr = endDate.toLocaleDateString('en-CA');
    
    fetch(`/api/habit-logs?startDate=${startStr}&endDate=${endStr}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const logsByDate = {};
          const freezeDays = new Set();
          
          data.data.forEach(log => {
            if (log.status === 'skipped-token') {
              freezeDays.add(log.dateString);
            } else if (log.status === 'completed') {
              logsByDate[log.dateString] = (logsByDate[log.dateString] || 0) + 1;
            }
          });
          
          setHabitLogs(logsByDate);
          setTokenDays(freezeDays);
        }
      })
      .catch(err => console.error("Error fetching logs for heatmap:", err));
  }, [startDate, endDate]);

  const getColorClass = (intensity, isTokenUsed) => {
    if (isTokenUsed) return 'bg-amber-400 border-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)] z-10';
    switch (intensity) {
      case 1: return 'bg-primary/30 border-primary/20';
      case 2: return 'bg-primary/60 border-primary/40';
      case 3: return 'bg-primary/80 border-primary/60';
      case 4: return 'bg-primary border-primary/80';
      default: return 'bg-surface-950/60 border-white/5';
    }
  };

  const handleBlockClick = (date, intensity, isTokenUsed) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const clickedDate = new Date(date);
    clickedDate.setHours(0,0,0,0);

    const clickedDateStr = new Date(date).toLocaleDateString('en-CA');

    // If past missed day, have tokens, not already used
    if (clickedDate < today && intensity === 0 && tokens > 0 && !isTokenUsed) {
      setTargetDate(clickedDateStr);
      setShowModal(true);
    }
  };

  const handleUseToken = async () => {
    if (tokens > 0 && targetDate) {
      try {
        const res = await fetch(`/api/habit-logs/token`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dateString: targetDate }) 
        });
        const data = await res.json();
        
        if (data.success) {
          setTokens(prev => prev - 1);
          setTokenDays(prev => new Set(prev).add(targetDate));
          
          // Deduct from user
          await fetch('/api/auth/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ streakTokens: tokens - 1 })
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    setShowModal(false);
    setTargetDate(null);
  };

  // Group dates by week (column)
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-primary">🔥</span> Activity Heatmap
        </h2>
        
        {/* Date Range Selector & Tokens */}
        <div className="flex items-center gap-4">
          {/* Tokens */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 font-medium text-sm" title="Streak Freeze Tokens">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {tokens}
          </div>

          <div className="relative">
            <select 
              value={rangeOption}
              onChange={(e) => setRangeOption(e.target.value)}
              className="appearance-none bg-surface-900/50 border border-white/10 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-primary transition-colors cursor-pointer text-gray-300 hover:text-white"
            >
              <option value="month">Current Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="lifetime">Lifetime</option>
            </select>
            {/* Custom Dropdown Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Wrapper */}
      <div className="flex-grow flex items-center md:justify-center overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
        <div className="flex gap-1.5 bg-surface-900/30 p-4 md:p-6 rounded-2xl border border-white/5 inline-flex w-max shadow-inner">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1.5">
              {week.map((date, dIndex) => {
                const dateObj = new Date(date);
                const dateStr = dateObj.toLocaleDateString('en-CA');
                const isTokenUsed = tokenDays.has(dateStr);
                const intensity = habitLogs[dateStr] || 0;
                // Only show blocks for dates strictly within our target range, 
                // but we might want to show them faded if they are padding days.
                // For a cleaner look, let's render all days in the week columns.
                const isOutOfRange = date < startDate || date > endDate;
                
                const today = new Date();
                today.setHours(0,0,0,0);
                const isMissedPast = date < today && intensity === 0;
                
                return (
                  <div 
                    key={dIndex}
                    onClick={() => handleBlockClick(date, intensity, isTokenUsed)}
                    title={`${date.toDateString()}: ${isTokenUsed ? 'Streak Frozen' : `${intensity} tasks`}`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] border transition-all duration-300 hover:scale-125 hover:z-10
                      ${getColorClass(intensity, isTokenUsed)} 
                      ${isOutOfRange ? 'opacity-20' : 'opacity-100'}
                      ${isMissedPast && !isTokenUsed && tokens > 0 ? 'cursor-pointer hover:border-amber-400/50 hover:bg-amber-400/20' : ''}
                    `}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] border border-white/5 bg-surface-800/50"></div>
          <div className="w-3 h-3 rounded-[2px] border border-primary/20 bg-primary/30"></div>
          <div className="w-3 h-3 rounded-[2px] border border-primary/40 bg-primary/60"></div>
          <div className="w-3 h-3 rounded-[2px] border border-primary/60 bg-primary/80"></div>
          <div className="w-3 h-3 rounded-[2px] border border-primary/80 bg-primary"></div>
        </div>
        <span>More</span>
      </div>

      {/* Token Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mb-4 mx-auto border border-amber-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Save your streak?</h3>
            <p className="text-gray-400 text-center mb-6 text-sm">
              You missed your habits on <strong className="text-gray-200">{targetDate}</strong>. Use 1 Rest Token to freeze this day and save your streak?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-lg text-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUseToken}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(251,191,36,0.3)]"
              >
                Use Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
