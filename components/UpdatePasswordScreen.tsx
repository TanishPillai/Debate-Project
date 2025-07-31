import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import * as Icons from './icons';

interface UpdatePasswordScreenProps {
  onSuccess: () => void;
}

export const UpdatePasswordScreen: React.FC<UpdatePasswordScreenProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setSuccess('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Your password has been updated successfully!');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white">Debate <span className="text-sky-400">Compass</span></h1>
        <p className="text-gray-400 mt-2">Your AI-Powered Sparring Partner</p>
      </div>
      <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-white mb-6">Set New Password</h2>
        {success ? (
          <div className="text-center">
            <Icons.CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-green-400 text-lg mb-6">{success}</p>
            <button
              onClick={onSuccess}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              Back to Log In
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="••••••••"
                required
              />
            </div>
             <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400"
              >
                {loading ? <Icons.LoadingSpinner className="w-6 h-6" /> : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
