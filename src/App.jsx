import React, { useState, useEffect } from 'react';
import GlobalLayout from './components/layout/GlobalLayout';
import Navbar from './components/layout/Navbar';
import HomeView from './components/views/HomeView';
import DashboardView from './components/views/DashboardView';
import LoginView from './components/views/LoginView';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data);
        setIsLoggedIn(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setUser(null);
      })
      .finally(() => setLoadingAuth(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setUser(null);
  };

  if (loadingAuth) {
    return (
      <GlobalLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout>
      {!isLoggedIn ? (
        <LoginView onLogin={(userData) => { setUser(userData); setIsLoggedIn(true); }} />
      ) : (
        <>
          <Navbar currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} />
          
          {/* View Routing */}
          <main className="mt-4 relative">
            {currentView === 'home' && <HomeView user={user} />}
            {currentView === 'dashboard' && <DashboardView user={user} />}
          </main>
        </>
      )}
    </GlobalLayout>
  );
}

export default App;
