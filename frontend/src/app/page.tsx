'use client';

import { useEffect, useState } from 'react';
import DealerDashboard from '@/components/DealerDashboard';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const { user, token, setAuth, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('dealer1@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Mock registration and login for quick demo setup
  const handleQuickStart = async (role: 'ADMIN' | 'DEALER') => {
    setLoading(true);
    try {
      // Try to register first (ignore error if exists)
      try {
        await axios.post(`${API_URL}/api/auth/register`, {
          email,
          password,
          name: role === 'ADMIN' ? 'Admin User' : 'Dealer John',
          role
        });
      } catch (e) { }

      // Login
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      setAuth(res.data.user, res.data.token);
      toast.success(`Logged in as ${role}`);
    } catch (error) {
      toast.error('Connection failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (token && user) {
    return (
      <>
        <Toaster position="top-right" />
        <DealerDashboard />
        <button
          onClick={logout}
          className="fixed bottom-8 right-8 bg-red-600/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-all"
        >
          Logout
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Real-Time Bidding</h1>
        <p className="text-slate-500 mb-8 text-sm">Sign in to access the bidding platform</p>

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-slate-900 transition-all font-medium"
              placeholder="email@example.com"
              suppressHydrationWarning
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-slate-900 transition-all font-medium"
              placeholder="••••••••"
              suppressHydrationWarning
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => handleQuickStart('DEALER')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-sm"
              suppressHydrationWarning
            >
              Dealer Login
            </button>
            <button
              onClick={() => handleQuickStart('ADMIN')}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-sm"
              suppressHydrationWarning
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
      <p className="mt-8 text-slate-400 text-xs">Regrip Bidding System © 2026</p>
    </div>
  );
}
