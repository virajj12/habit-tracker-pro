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

  const [notificationPerm, setNotificationPerm] = useState('default');

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPerm(Notification.permission);
    }
  }, []);

  const handleNotificationRequest = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotificationPerm(perm);
      if (perm === 'granted') {
        window.dispatchEvent(new Event('push_permission_granted'));
      }
    }
  };

  return (
    <nav className="flex flex-wrap items-center justify-between gap-y-4 mb-4 md:mb-8 pb-4 border-b border-white/5 relative">
      {/* Brand Identity */}
      <div className="flex items-center gap-4">
        <div className="text-xl md:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary cursor-default">
          HABIT TRACKER
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex items-center gap-4 md:gap-8 bg-surface-900/50 px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-white/5 backdrop-blur-sm order-3 w-full justify-center md:order-none md:w-auto md:justify-start">
        <button
          onClick={() => setCurrentView('home')}
          className={`transition-colors text-sm md:text-base font-medium ${currentView === 'home' ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Home
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`transition-colors text-sm md:text-base font-medium ${currentView === 'dashboard' ? 'text-secondary' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Dashboard
        </button>
      </div>

      {/* Structural Space for Future Features (Profile, Settings, Premium) */}
      <div className="flex items-center gap-4 justify-end" ref={dropdownRef}>
        
        {/* Notification Bell */}
        <button 
          onClick={handleNotificationRequest}
          title={notificationPerm === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
            notificationPerm === 'granted' 
              ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20' 
              : 'bg-surface-800 border-white/10 text-gray-400 hover:bg-surface-700 hover:text-gray-200'
          }`}
        >
          {notificationPerm === 'granted' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )}
        </button>

        <div className="relative ml-2">
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
