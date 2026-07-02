import React from 'react';
import GlassCard from '../layout/GlassCard';

export default function DashboardView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      
      {/* Analytics Overview */}
      <GlassCard className="lg:col-span-2">
        <h2 className="text-xl font-semibold mb-6">Analytics Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
            <div className="text-sm text-gray-400 mb-1">Completion Rate</div>
            <div className="text-3xl font-bold text-primary">87%</div>
          </div>
          <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
            <div className="text-sm text-gray-400 mb-1">Current Streak</div>
            <div className="text-3xl font-bold text-secondary">14 Days</div>
          </div>
          <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
            <div className="text-sm text-gray-400 mb-1">Total Tasks Done</div>
            <div className="text-3xl font-bold text-white">342</div>
          </div>
        </div>
      </GlassCard>

      {/* Placeholder Charts */}
      <GlassCard className="h-64 flex flex-col items-center justify-center text-white/40 border border-dashed border-white/10">
        <span className="mb-2">📊</span>
        <span>Weekly Progress Chart</span>
      </GlassCard>

      <GlassCard className="h-64 flex flex-col items-center justify-center text-white/40 border border-dashed border-white/10">
        <span className="mb-2">📈</span>
        <span>Habit Distribution</span>
      </GlassCard>

    </div>
  );
}
