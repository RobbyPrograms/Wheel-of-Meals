'use client';

import { useState } from 'react';
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
        if (window.usernameTimeout) {
          clearTimeout(window.usernameTimeout);
        }
        // Set new timer
        window.usernameTimeout = setTimeout(() => {
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
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-primary mb-6">Join the Wizards</h2>
      <p className="text-sm text-center text-gray-600 mb-6">
        Begin your magical culinary journey
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Choose Your Wizard Name (Optional)
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="wizardname"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                username && (
                  usernameAvailable === true
                    ? 'border-green-500'
                    : usernameAvailable === false
                    ? 'border-red-500'
                    : 'border-gray-300'
                )
              }`}
            />
            {checkingUsername && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FaSpinner className="animate-spin text-gray-400" />
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
            Magic Scroll (Email) *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Secret Incantation *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            required
            minLength={6}
          />
          <p className="mt-1 text-sm text-gray-500">
            Must be at least 6 magical characters
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Incantation *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (username !== '' && !usernameAvailable)}
          className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            'Become a Wizard'
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already a wizard?{' '}
        <a href="/login" className="text-accent hover:text-accent/90">
          Enter the Realm
        </a>
      </p>
    </div>
  );
} 