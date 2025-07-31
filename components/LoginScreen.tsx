

import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import * as Icons from './icons';

export const LoginScreen: React.FC = () => {
  const [view, setView] = useState<'login' | 'signup' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, Supabase handles the redirect, so no need to setLoading(false).
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setInfo('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Redirects user back to the app's home page after password reset
    });

    if (error) {
      setError(error.message);
    } else {
      setInfo('If an account with this email exists, a password reset link has been sent.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'reset') return; // Reset is handled by its own form/handler

    if (view === 'signup' && !name) {
      setError('Please enter your name.');
      return;
    }
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setInfo('');
    setLoading(true);

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else { // Signup
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setInfo("Success! Please check your email for a confirmation link to log in.");
      }
    }
    setLoading(false);
  };

  const switchView = (newView: 'login' | 'signup' | 'reset') => {
    setError('');
    setInfo('');
    setPassword('');
    // Keep email if switching from login to reset, otherwise clear it
    if (!(view === 'login' && newView === 'reset')) {
        setEmail('');
    }
    setView(newView);
  };

  const renderForms = () => {
    if (view === 'reset') {
      return (
        <>
          <h2 className="text-3xl font-bold text-center text-white mb-6">
            Reset Password
          </h2>
          {info && <p className="text-green-400 text-sm mb-4 text-center">{info}</p>}
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => switchView('login')} className="text-sm text-sky-400 hover:text-sky-300 font-medium">
              Back to Log in
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          {view === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        {info && <p className="text-green-400 text-sm mb-4 text-center">{info}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {view === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={view === 'login' ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
            />
          </div>
          
          {view === 'login' && (
              <div className="text-right text-sm">
                  <button type="button" onClick={() => switchView('reset')} className="font-medium text-sky-400 hover:text-sky-300">
                      Forgot your password?
                  </button>
              </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400">
              {loading ? 'Processing...' : view === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <button onClick={handleGoogleLogin} disabled={loading} className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-colors disabled:opacity-50">
            <Icons.GoogleIcon className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => switchView(view === 'login' ? 'signup' : 'login')} className="text-sm text-sky-400 hover:text-sky-300 font-medium">
            {view === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white">Debate <span className="text-sky-400">Compass</span></h1>
        <p className="text-gray-400 mt-2">Your AI-Powered Sparring Partner</p>
      </div>
      <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 p-8 rounded-2xl shadow-2xl">
        {renderForms()}
      </div>
    </div>
  );
};