import React, { useState } from 'react';

const DAYS_OF_WEEK = [
  { label: 'S', value: 'Sun' },
  { label: 'M', value: 'Mon' },
  { label: 'T', value: 'Tue' },
  { label: 'W', value: 'Wed' },
  { label: 'T', value: 'Thu' },
  { label: 'F', value: 'Fri' },
  { label: 'S', value: 'Sat' },
];

export default function NewTaskForm({ onTaskAdded }) {
  const [taskName, setTaskName] = useState('');
  const [isDaily, setIsDaily] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [skipDays, setSkipDays] = useState([]);
  
  const [timeOption, setTimeOption] = useState('any'); // any, fixed, range
  const [fixedTime, setFixedTime] = useState('');
  const [timeRangeStart, setTimeRangeStart] = useState('');
  const [timeRangeEnd, setTimeRangeEnd] = useState('');

  const [categories, setCategories] = useState(['General', 'Health', 'Work', 'Productivity']);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const toggleSkipDay = (dayValue) => {
    if (skipDays.includes(dayValue)) {
      setSkipDays(skipDays.filter(d => d !== dayValue));
    } else {
      setSkipDays([...skipDays, dayValue]);
    }
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === 'CREATE_NEW') {
      setIsCreatingCategory(true);
      setSelectedCategory('');
    } else {
      setIsCreatingCategory(false);
      setSelectedCategory(val);
    }
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim() !== '') {
      setCategories([...categories, newCategoryName]);
      setSelectedCategory(newCategoryName);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const payload = {
      name: taskName,
      category: selectedCategory,
      type: 'positive', // Default type for new tasks
      schedule: isDaily ? 'daily' : 'specific',
      skipDays,
      timePref: timeOption
    };

    if (timeOption === 'fixed') payload.timeSpecific = fixedTime;
    if (timeOption === 'range') payload.timeSpecific = `${timeRangeStart}-${timeRangeEnd}`;
    
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && onTaskAdded) {
        onTaskAdded(data.data);
        // Reset form slightly
        setTaskName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm">
      {/* Task Name */}
      <div>
        <label className="block text-gray-400 mb-1">Task Name</label>
        <input 
          type="text" 
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="e.g. Read 10 pages" 
          className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-600"
        />
      </div>

      {/* Date Range Configuration */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-gray-400">Date Range</label>
          <div className="flex bg-surface-900/50 rounded-lg border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDaily(true)}
              className={`px-3 py-1 transition-colors ${isDaily ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setIsDaily(false)}
              className={`px-3 py-1 transition-colors ${!isDaily ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
            >
              Specific
            </button>
          </div>
        </div>
        
        {!isDaily && (
          <div className="flex gap-3 mt-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <span className="text-gray-500 self-center">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}
      </div>

      {/* Skip Days */}
      <div>
        <label className="block text-gray-400 mb-1">Skip Days <span className="text-xs text-gray-600">(Optional)</span></label>
        <div className="flex justify-between gap-1">
          {DAYS_OF_WEEK.map((day) => {
            const isSkipped = skipDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleSkipDay(day.value)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors
                  ${isSkipped 
                    ? 'bg-red-500/20 border-red-500/50 text-red-300' 
                    : 'bg-surface-900/50 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                title={isSkipped ? `Skipping ${day.value}` : `Include ${day.value}`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      <div>
        <label className="block text-gray-400 mb-1">Schedule <span className="text-xs text-gray-600">(Optional)</span></label>
        <select 
          value={timeOption}
          onChange={(e) => setTimeOption(e.target.value)}
          className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer mb-2"
        >
          <option value="any">Anytime</option>
          <option value="fixed">Fixed Time</option>
          <option value="range">Time Range</option>
        </select>
        
        {timeOption === 'fixed' && (
          <input 
            type="time" 
            value={fixedTime}
            onChange={(e) => setFixedTime(e.target.value)}
            className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
          />
        )}
        
        {timeOption === 'range' && (
          <div className="flex gap-3">
            <input 
              type="time" 
              value={timeRangeStart}
              onChange={(e) => setTimeRangeStart(e.target.value)}
              className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <span className="text-gray-500 self-center">to</span>
            <input 
              type="time" 
              value={timeRangeEnd}
              onChange={(e) => setTimeRangeEnd(e.target.value)}
              className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-gray-400 mb-1">Category</label>
        {!isCreatingCategory ? (
          <select 
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="CREATE_NEW" className="text-primary font-bold">+ Create New Category</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New Category Name"
              className="w-full bg-surface-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <button 
              type="button" 
              onClick={handleAddNewCategory}
              className="bg-primary hover:bg-primary/80 text-white px-3 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
            <button 
              type="button" 
              onClick={() => setIsCreatingCategory(false)}
              className="bg-surface-800/50 hover:bg-surface-700/50 text-gray-400 border border-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <button type="submit" className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 shadow-lg shadow-primary/20">
        Add Task
      </button>
    </form>
  );
}
