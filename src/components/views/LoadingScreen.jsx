import React, { useEffect, useState } from 'react';

export default function LoadingScreen({ isLoading, onAnimationComplete }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsClosing(true);
      // Wait for zoom out animation to finish before calling onAnimationComplete
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 800); // 800ms exit animation matching the CSS duration
      return () => clearTimeout(timer);
    }
  }, [isLoading, onAnimationComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-700 ${isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className={`relative flex items-center justify-center ${isClosing ? 'animate-zoom-out' : 'animate-form-in'}`}>
         {/* The text "focus" */}
         <h1 className="text-5xl md:text-7xl font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
           Focus
         </h1>
      </div>
    </div>
  );
}
