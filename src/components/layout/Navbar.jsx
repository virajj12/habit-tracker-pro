import React, { useState, useRef, useEffect } from 'react';

export default function Navbar({ currentView, setCurrentView, user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'USR';

  return (
    <nav className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 relative">
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
      <div className="flex items-center gap-4 w-32 justify-end" ref={dropdownRef}>
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center hover:bg-surface-700 hover:border-primary/50 transition-all focus:outline-none"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="text-xs font-semibold text-gray-200">{initials}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-800 rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Pioneer'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
              </div>
              <div className="p-1">
                <button 
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
