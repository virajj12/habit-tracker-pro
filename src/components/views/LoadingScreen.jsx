import React, { useEffect, useState } from 'react';

const LOADING_WORDS = ['Focus', 'Consistency', 'Discipline', 'Momentum', 'Growth', 'Dedication', 'Progress'];

export default function LoadingScreen({ isLoading, onAnimationComplete }) {
  const [isClosing, setIsClosing] = useState(false);
  const [word, setWord] = useState('Focus');

  useEffect(() => {
    // Pick a random word on mount
    setWord(LOADING_WORDS[Math.floor(Math.random() * LOADING_WORDS.length)]);
  }, []);

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
         {/* The motivational word */}
         <h1 className="text-5xl md:text-7xl font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
           {word}
         </h1>
      </div>
    </div>
  );
}
