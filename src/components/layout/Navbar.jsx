import React from 'react';

export default function Navbar({ currentView, setCurrentView }) {
  return (
    <nav className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
      {/* Brand Identity */}
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary cursor-default">
          HABIT TRACKER
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex items-center gap-8 bg-surface-900/50 px-6 py-2 rounded-full border border-white/5 backdrop-blur-sm">
        <button
          onClick={() => setCurrentView('home')}
          className={`transition-colors font-medium ${currentView === 'home' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Home
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`transition-colors font-medium ${currentView === 'dashboard' ? 'text-secondary' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Dashboard
        </button>
      </div>

      {/* Structural Space for Future Features (Profile, Settings, Premium) */}
      <div className="flex items-center gap-4 w-32 justify-end">
        {/* Placeholder for Profile Icon */}
        <div className="w-10 h-10 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center opacity-50 cursor-not-allowed">
          <span className="text-xs">USR</span>
        </div>
      </div>
    </nav>
  );
}
