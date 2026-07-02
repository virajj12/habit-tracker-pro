import React from 'react';

export default function GlassCard({ children, className = '' }) {
  return (
    <div className={`bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}
