import React, { useState, useEffect } from 'react';
import GlobalLayout from './components/layout/GlobalLayout';
import Navbar from './components/layout/Navbar';
import HomeView from './components/views/HomeView';
import DashboardView from './components/views/DashboardView';
import LoginView from './components/views/LoginView';
import ResetPasswordView from './components/views/ResetPasswordView';
import LoadingScreen from './components/views/LoadingScreen';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [resetToken, setResetToken] = useState(null);
  const [appReady, setAppReady] = useState(false);

  // Swipe gesture state
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  // Minimum distance in pixels to trigger a swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEndX(null); // Reset end position
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentView === 'home') {
      setCurrentView('dashboard');
    }
    if (isRightSwipe && currentView === 'dashboard') {
      setCurrentView('home');
    }
  };

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

  return (
    <>
      {/* Loading Screen Overlay */}
      {!appReady && (
        <LoadingScreen 
          isLoading={loadingAuth} 
          onAnimationComplete={() => setAppReady(true)} 
        />
      )}

      {/* Main App content mounts underneath the loading screen while it's closing */}
      {(!loadingAuth) && (
        <GlobalLayout>
          {resetToken && !isLoggedIn ? (
            <ResetPasswordView 
              resetToken={resetToken} 
              onResetComplete={() => setResetToken(null)} 
            />
          ) : !isLoggedIn ? (
            <LoginView onLogin={(userData) => { setUser(userData); setIsLoggedIn(true); }} />
          ) : (
            <>
              <Navbar currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} user={user} />
              
              {/* View Routing */}
              <main 
                className="mt-4 relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {currentView === 'home' && <HomeView user={user} />}
                {currentView === 'dashboard' && <DashboardView user={user} />}
              </main>
            </>
          )}
        </GlobalLayout>
      )}
    </>
  );
}

export default App;
