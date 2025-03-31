'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaSpinner } from 'react-icons/fa';

export default function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameTimeoutRef = useRef<NodeJS.Timeout>();

  // Check username availability with debounce
  const checkUsername = async (username: string) => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase.rpc(
        'check_username_availability',
        { username }
      );

      if (error) throw error;
      setUsernameAvailable(data);
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounce username check
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value) {
      // Only check if there's a value and it matches the format
      if (/^[a-zA-Z0-9_]+$/.test(value)) {
        // Clear any previous timer
        if (usernameTimeoutRef.current) {
          clearTimeout(usernameTimeoutRef.current);
        }
        // Set new timer
        usernameTimeoutRef.current = setTimeout(() => {
          checkUsername(value);
        }, 500);
      } else {
        setUsernameAvailable(false);
      }
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Required fields validation
      if (!email || !password || !confirmPassword) {
        throw new Error('Email and password are required');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Username validation if provided
      if (username) {
        if (!usernameAvailable) {
          throw new Error('Please choose a different username');
        }
        if (username.length < 3) {
          throw new Error('Username must be at least 3 characters');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          throw new Error('Username can only contain letters, numbers, and underscores');
        }
      }

      // Call signUp from auth context
      const { error: signUpError } = await signUp(email, password, username);

      if (signUpError) {
        throw signUpError;
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      console.error('Error during signup:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#319141] mb-3">Join SavoryCircle</h2>
        <p className="text-gray-600">
          Start your culinary adventure today
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Choose Your Username
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="username"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319141] focus:border-transparent transition-colors ${
                username && (
                  usernameAvailable === true
                    ? 'border-[#319141]'
                    : usernameAvailable === false
                    ? 'border-red-500'
                    : 'border-gray-300'
                )
              }`}
            />
            {checkingUsername && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FaSpinner className="animate-spin text-[#319141]" />
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Letters, numbers, and underscores only (optional)
          </p>
          {username && usernameAvailable === false && !checkingUsername && (
            <p className="mt-1 text-sm text-red-500">
              This username is not available
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319141] focus:border-transparent transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319141] focus:border-transparent transition-colors"
            required
            minLength={6}
          />
          <p className="mt-1 text-sm text-gray-500">
            Must be at least 6 characters
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#319141] focus:border-transparent transition-colors"
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#319141] hover:bg-[#319141]/90 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-[#319141] hover:text-[#319141]/80 font-medium">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
} 