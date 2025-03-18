'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/supabase';
import { FaSpinner } from 'react-icons/fa';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setDisplayName(data.display_name || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = async (username: string) => {
    if (username === profile?.username) {
      setUsernameError(null);
      return true;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (data) {
        setUsernameError('This username is already taken');
        return false;
      }

      setUsernameError(null);
      return true;
    } catch (err) {
      return true; // No match found, username is available
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    const isUsernameValid = await validateUsername(username);
    if (!isUsernameValid) {
      return;
    }

    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          username: username.trim(),
          display_name: displayName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setSuccess(true);
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Please sign in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-primary mb-6">Profile Settings</h1>

        {loading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin text-2xl text-accent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  validateUsername(e.target.value);
                }}
                className={`w-full px-4 py-2 border ${
                  usernameError ? 'border-red-500' : 'border-gray-200'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent`}
                required
              />
              {usernameError && (
                <p className="mt-1 text-sm text-red-500">{usernameError}</p>
              )}
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <p className="mt-1 text-sm text-text-secondary">
                This is your public display name. It can be your real name or a nickname.
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {success && (
              <p className="text-green-500 text-sm">Profile updated successfully!</p>
            )}

            <button
              type="submit"
              disabled={saving || !!usernameError}
              className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <FaSpinner className="animate-spin mx-auto" />
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 