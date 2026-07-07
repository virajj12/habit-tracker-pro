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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Minimum distance in pixels to trigger a swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEndX(null); // Reset end position
    setTouchStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    const currentX = e.targetTouches[0].clientX;
    setTouchEndX(currentX);
    
    if (touchStartX) {
      const offset = currentX - touchStartX;
      // Prevent dragging past edges
      if (currentView === 'home' && offset > 0) return;
      if (currentView === 'dashboard' && offset < 0) return;
      
      setDragOffset(offset);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (!touchStartX || !touchEndX) {
      setDragOffset(0);
      return;
    }
    
    const distance = touchStartX - touchEndX;
    
    if (distance > minSwipeDistance && currentView === 'home') {
      setCurrentView('dashboard');
    } else if (distance < -minSwipeDistance && currentView === 'dashboard') {
      setCurrentView('home');
    }
    
    setDragOffset(0);
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
                className="mt-4 relative overflow-hidden touch-pan-y w-full"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div 
                  className="flex w-full h-full"
                  style={{ 
                    transform: `translateX(calc(${currentView === 'home' ? '0%' : '-100%'} + ${dragOffset}px))`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                  }}
                >
                  <div className="w-full shrink-0">
                    <HomeView user={user} />
                  </div>
                  <div className="w-full shrink-0">
                    <DashboardView user={user} />
                  </div>
                </div>
              </main>
            </>
          )}
        </GlobalLayout>
      )}
    </>
  );
}

export default App;
