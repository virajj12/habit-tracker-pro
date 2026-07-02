import React, { useState } from 'react';
import GlassCard from '../layout/GlassCard';

export default function LoginView({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name) {
          setError('Name is required for sign up');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          let data = {};
          try {
            data = await res.json();
          } catch (err) {
            throw new Error('Server error: Please check your environment variables.');
          }
          throw new Error(data.message || 'Failed to sign up');
        }

        // Auto login after signup
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!loginRes.ok) throw new Error('Auto-login failed');
        const userData = await loginRes.json();
        onLogin(userData);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          let data = {};
          try {
            data = await res.json();
          } catch (err) {
            throw new Error('Server error: Please check your environment variables.');
          }
          throw new Error(data.message || 'Invalid credentials');
        }
        
        const userData = await res.json();
        onLogin(userData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm mb-2">
            Habit Tracker
          </h1>
          <p className="text-gray-400">
            {isSignUp ? 'Join the movement to build unstoppable momentum.' : 'Sign in to track your habits and momentum.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {isSignUp && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-gray-400 mb-1.5 text-sm">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Pioneer" 
                className="w-full bg-surface-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-600"
                required={isSignUp}
              />
            </div>
          )}
          <div>
            <label className="block text-gray-400 mb-1.5 text-sm">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pioneer@antigravity.app" 
              className="w-full bg-surface-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1.5 text-sm">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-surface-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-600"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-3 rounded-xl transition-opacity mt-4 shadow-[0_0_15px_rgba(239,68,68,0.4)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Launch Tracker')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span 
            className="text-secondary cursor-pointer hover:underline font-medium"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
