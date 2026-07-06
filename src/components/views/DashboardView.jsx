import React, { useState, useEffect } from 'react';
import GlassCard from '../layout/GlassCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function DashboardView() {
  const [stats, setStats] = useState({
    completionRate: 0,
    currentStreak: 0,
    totalTasksDone: 0,
    weeklyProgress: [],
    habitDistribution: []
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(err => console.error("Error fetching analytics:", err));

    fetch('/api/analytics/history')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(data.data);
        }
      })
      .catch(err => console.error("Error fetching history:", err));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      
      {/* Analytics Overview */}
      <GlassCard className="lg:col-span-2">
        <h2 className="text-xl font-semibold mb-6">Analytics Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
            <div className="text-sm text-gray-400 mb-1">Completion Rate (30d)</div>
            <div className="text-3xl font-bold text-primary">{stats.completionRate}%</div>
          </div>
          <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
            <div className="text-sm text-gray-400 mb-1">Current Streak</div>
            <div className="text-3xl font-bold text-secondary">{stats.currentStreak} Days</div>
          </div>
          <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
            <div className="text-sm text-gray-400 mb-1">Total Tasks Done</div>
            <div className="text-3xl font-bold text-white">{stats.totalTasksDone}</div>
          </div>
        </div>
      </GlassCard>

      {/* Weekly Progress Chart */}
      <GlassCard className="h-80 flex flex-col">
        <h3 className="text-lg font-medium mb-4">Weekly Progress</h3>
        <div className="flex-1 w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weeklyProgress}>
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{ backgroundColor: '#181A1F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#F9FAFB' }}
              />
              <Bar dataKey="completed" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Habit Distribution Chart */}
      <GlassCard className="h-80 flex flex-col">
        <h3 className="text-lg font-medium mb-4">Habit Distribution</h3>
        <div className="flex-1 w-full min-h-[200px] flex items-center justify-center">
          {stats.habitDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.habitDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.habitDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#181A1F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#F9FAFB' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-white/40">No habits added yet</div>
          )}
        </div>
      </GlassCard>

      {/* Completion History */}
      <GlassCard className="lg:col-span-2 flex flex-col">
        <h3 className="text-lg font-medium mb-4">Completion History</h3>
        <div className="flex-1 overflow-x-auto">
          {history.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="pb-3 px-4 font-medium">Habit</th>
                  <th className="pb-3 px-4 font-medium">Category</th>
                  <th className="pb-3 px-4 font-medium">Date</th>
                  <th className="pb-3 px-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {history.map((log) => {
                  const d = new Date(log.loggedAt);
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const habit = log.habitId || { name: 'Unknown', icon: '❓', category: 'General' };

                  return (
                    <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <span className="text-xl">{habit.icon}</span>
                        <span className="font-medium text-white">{habit.name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                          {habit.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{dateStr}</td>
                      <td className="py-4 px-4 text-gray-400">{timeStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-white/40 py-8">No tasks completed yet. Go crush some habits!</div>
          )}
        </div>
      </GlassCard>

    </div>
  );
}
