import React, { useState, useEffect } from 'react';
import GlobalLayout from './components/layout/GlobalLayout';
import Navbar from './components/layout/Navbar';
import HomeView from './components/views/HomeView';
import DashboardView from './components/views/DashboardView';
import LoginView from './components/views/LoginView';
import ResetPasswordView from './components/views/ResetPasswordView';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    // Check for password reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('resetToken');
    if (token) {
      setResetToken(token);
      // Remove token from URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }

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

  // Handle Password Reset Flow
  if (resetToken && !isLoggedIn) {
    return (
      <GlobalLayout>
        <ResetPasswordView 
          resetToken={resetToken} 
          onResetComplete={() => setResetToken(null)} 
        />
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout>
      {!isLoggedIn ? (
        <LoginView onLogin={(userData) => { setUser(userData); setIsLoggedIn(true); }} />
      ) : (
        <>
          <Navbar currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} user={user} />
          
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
