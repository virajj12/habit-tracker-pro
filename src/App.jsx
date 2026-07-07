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
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerticalScroll, setIsVerticalScroll] = useState(false);

  // Minimum distance in pixels to trigger a swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEndX(null); // Reset end position
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setIsVerticalScroll(false);
    setIsDragging(false);
  };

  const onTouchMove = (e) => {
    if (isVerticalScroll) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    
    if (touchStartX !== null && touchStartY !== null) {
      const deltaX = currentX - touchStartX;
      const deltaY = currentY - touchStartY;
      
      // Determine swipe axis after a small movement threshold
      if (!isDragging) {
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          if (Math.abs(deltaY) > Math.abs(deltaX)) {
            setIsVerticalScroll(true);
            return;
          } else {
            setIsDragging(true);
          }
        } else {
          return; // Wait until they move enough to decide
        }
      }

      setTouchEndX(currentX);

      // Prevent dragging past edges
      if (currentView === 'home' && deltaX > 0) return;
      if (currentView === 'dashboard' && deltaX < 0) return;
      
      setDragOffset(deltaX);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    setIsVerticalScroll(false);
    
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
    setTouchStartX(null);
    setTouchStartY(null);
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
                  className="flex w-[200%] h-full"
                  style={{ 
                    transform: `translateX(calc(${currentView === 'home' ? '0%' : '-50%'} + ${dragOffset}px))`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                  }}
                >
                  <div className="w-1/2 shrink-0 overflow-x-hidden px-1">
                    <HomeView user={user} />
                  </div>
                  <div className="w-1/2 shrink-0 overflow-x-hidden px-1">
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
