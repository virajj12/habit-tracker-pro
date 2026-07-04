import React, { useState, useEffect } from 'react';
import { ICONS, IconRenderer } from '../ui/Icons';

const DAYS_OF_WEEK = [
  { label: 'S', value: 'Sun' },
  { label: 'M', value: 'Mon' },
  { label: 'T', value: 'Tue' },
  { label: 'W', value: 'Wed' },
  { label: 'T', value: 'Thu' },
  { label: 'F', value: 'Fri' },
  { label: 'S', value: 'Sat' },
];

export default function NewTaskForm({ onTaskAdded, initialData, onTaskUpdated, onCancel }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const [taskName, setTaskName] = useState(initialData?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || 'star');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNoChanges, setShowNoChanges] = useState(false);
  const [isDaily, setIsDaily] = useState(initialData?.dateRange ? initialData.dateRange.isDaily : true);
  const [startDate, setStartDate] = useState(initialData?.dateRange?.startDate ? formatDate(initialData.dateRange.startDate) : '');
  const [endDate, setEndDate] = useState(initialData?.dateRange?.endDate ? formatDate(initialData.dateRange.endDate) : '');
  
  const [skipDays, setSkipDays] = useState(initialData?.skipDays || []);
  
  const [timeOption, setTimeOption] = useState(initialData?.scheduledTime?.timeOption || 'any'); // any, fixed, range
  const [fixedTime, setFixedTime] = useState(initialData?.scheduledTime?.fixedTime || '');
  const [timeRangeStart, setTimeRangeStart] = useState(initialData?.scheduledTime?.timeRangeStart || '');
  const [timeRangeEnd, setTimeRangeEnd] = useState(initialData?.scheduledTime?.timeRangeEnd || '');

  // Keep state in sync if initialData changes
  useEffect(() => {
    if (initialData) {
      setTaskName(initialData.name || '');
      setIsDaily(initialData.dateRange ? initialData.dateRange.isDaily : true);
      setStartDate(initialData.dateRange?.startDate ? formatDate(initialData.dateRange.startDate) : '');
      setEndDate(initialData.dateRange?.endDate ? formatDate(initialData.dateRange.endDate) : '');
      setSkipDays(initialData.skipDays || []);
      setTimeOption(initialData.scheduledTime?.timeOption || 'any');
      setFixedTime(initialData.scheduledTime?.fixedTime || '');
      setTimeRangeStart(initialData.scheduledTime?.timeRangeStart || '');
      setTimeRangeEnd(initialData.scheduledTime?.timeRangeEnd || '');
      setSelectedCategory(initialData.category || 'General');
      setSelectedIcon(initialData.icon || 'star');
    }
  }, [initialData]);

  const [categories, setCategories] = useState(['General', 'Health', 'Work', 'Productivity']);
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'General');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    // Fetch user categories
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const userCategories = data.data.map(c => c.name);
          const allCategories = [...new Set(['General', 'Health', 'Work', 'Productivity', ...userCategories])];
          setCategories(allCategories);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

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

  const handleAddNewCategory = async () => {
    if (newCategoryName.trim() !== '') {
      const catName = newCategoryName.trim();
      
      // Optimsitic UI
      if (!categories.includes(catName)) {
        setCategories([...categories, catName]);
      }
      setSelectedCategory(catName);
      setNewCategoryName('');
      setIsCreatingCategory(false);

      // Save to database
      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName })
        });
      } catch (err) {
        console.error("Error creating category:", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const isEditing = !!initialData;
    
    if (isEditing) {
      const hasChanges = 
        taskName !== (initialData.name || '') ||
        selectedIcon !== (initialData.icon || 'star') ||
        selectedCategory !== (initialData.category || 'General') ||
        isDaily !== (initialData.dateRange ? initialData.dateRange.isDaily : true) ||
        startDate !== (initialData.dateRange?.startDate ? formatDate(initialData.dateRange.startDate) : '') ||
        endDate !== (initialData.dateRange?.endDate ? formatDate(initialData.dateRange.endDate) : '') ||
        JSON.stringify(skipDays) !== JSON.stringify(initialData.skipDays || []) ||
        timeOption !== (initialData.scheduledTime?.timeOption || 'any') ||
        fixedTime !== (initialData.scheduledTime?.fixedTime || '') ||
        timeRangeStart !== (initialData.scheduledTime?.timeRangeStart || '') ||
        timeRangeEnd !== (initialData.scheduledTime?.timeRangeEnd || '');

      if (!hasChanges) {
        setShowNoChanges(true);
        setTimeout(() => setShowNoChanges(false), 1500);
        return;
      }
    }

    setIsSubmitting(true);
    const payload = {
      name: taskName,
      icon: selectedIcon,
      category: selectedCategory,
      habitType: 'positive', 
      dateRange: {
        isDaily,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      skipDays,
      scheduledTime: {
        timeOption,
        fixedTime: timeOption === 'fixed' ? fixedTime : undefined,
        timeRangeStart: timeOption === 'range' ? timeRangeStart : undefined,
        timeRangeEnd: timeOption === 'range' ? timeRangeEnd : undefined,
      }
    };
    
    try {
      const url = isEditing ? `/api/habits/${initialData._id}` : '/api/habits';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setShowSuccess(true);
        
        if (!isEditing && onTaskAdded) {
          onTaskAdded(data.data);
          setTaskName('');
        }
        
        setTimeout(() => {
          setShowSuccess(false);
          if (isEditing && onTaskUpdated) {
            onTaskUpdated(data.data);
          }
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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

      {/* Icon Selector */}
      <div>
        <label className="block text-gray-400 mb-1">Icon</label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(ICONS).map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setSelectedIcon(iconName)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                selectedIcon === iconName
                  ? 'bg-primary/20 border-primary text-primary border-2 shadow-[0_0_15px_rgba(var(--color-primary),0.3)]'
                  : 'bg-surface-900/50 border-white/10 text-gray-400 border hover:bg-surface-800 hover:text-white hover:border-white/30'
              }`}
              title={iconName}
            >
              <IconRenderer iconName={iconName} className="w-5 h-5" />
            </button>
          ))}
        </div>
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

      <div className="flex gap-3 mt-2">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="w-1/3 bg-surface-800/50 hover:bg-surface-700/50 text-gray-400 border border-white/10 py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={isSubmitting || showSuccess || showNoChanges || !taskName.trim()}
          className={`${onCancel ? 'w-2/3' : 'w-full'} font-medium py-2.5 rounded-lg transition-all shadow-lg flex justify-center items-center gap-2
            ${showSuccess 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
              : showNoChanges
                ? 'bg-gray-500 text-white shadow-gray-500/20'
              : !taskName.trim()
                ? 'bg-surface-800 text-gray-500 cursor-not-allowed border border-white/5'
                : 'bg-primary hover:bg-primary/80 text-white shadow-primary/20'
            }
            ${isSubmitting ? 'cursor-wait opacity-90' : ''}
          `}
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {showSuccess && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          )}
          {showNoChanges && (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          )}
          {showSuccess ? (initialData ? 'Saved!' : 'Task Added!') : showNoChanges ? 'No changes' : isSubmitting ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Task')}
        </button>
      </div>
    </form>
  );
}
