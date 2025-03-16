'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FaSpinner, FaUser } from 'react-icons/fa';

type Profile = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<Profile>({
    username: '',
    display_name: '',
    avatar_url: null,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile(data);
      setFormData({
        username: data.username,
        display_name: data.display_name || '',
        avatar_url: data.avatar_url,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate username
      if (formData.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          username: formData.username,
          display_name: formData.display_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      await fetchProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Profile Settings</h1>
          <p className="text-text-secondary mb-6">Please log in to view your profile.</p>
          <Link
            href="/login"
            className="inline-block bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-primary mb-6">Profile Settings</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border-l-4 border-green-500">
              {success}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <FaSpinner className="animate-spin text-3xl text-accent mx-auto mb-4" />
              <p className="text-text-secondary">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter username"
                  required
                  minLength={3}
                  pattern="^[a-zA-Z0-9_]+$"
                  title="Username can only contain letters, numbers, and underscores"
                />
                <p className="mt-1 text-sm text-text-secondary">
                  Only letters, numbers, and underscores allowed
                </p>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={formData.display_name || ''}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter display name"
                />
                <p className="mt-1 text-sm text-text-secondary">
                  This is how your name will appear to other users
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 