'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaKey, FaSave, FaTimes } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import AvatarUpload from '@/components/AvatarUpload';
import { format as formatDate } from 'date-fns';

type ProfileData = {
  name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  experience_points: number;
  current_level: number;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    username: '',
    avatar_url: null,
    created_at: '',
    experience_points: 0,
    current_level: 1
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        username: '',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: user.user_metadata?.created_at || '',
        experience_points: user.user_metadata?.experience_points || 0,
        current_level: user.user_metadata?.current_level || 1
      });
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username, avatar_url, created_at, experience_points, current_level')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData(prev => ({
          ...prev,
          username: data.username,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
          experience_points: data.experience_points || 0,
          current_level: data.current_level || 1
        }));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handlePasswordToggle = () => {
    setIsChangingPassword(!isChangingPassword);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update user profile in Supabase
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: profileData.username,
          name: profileData.name,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;
      
      setNotification({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      
      setIsEditing(false);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update profile. Please try again.'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({
        type: 'error',
        message: 'New passwords do not match.'
      });
      return;
    }
    
    // This is a placeholder - in a real app, you would update the password
    // through Supabase or your backend
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNotification({
        type: 'success',
        message: 'Password updated successfully!'
      });
      
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to update password. Please try again.'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;
    
    try {
      // Update user_profiles table with new avatar_url
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setProfileData(prev => ({
        ...prev,
        avatar_url: url
      }));
      
      setNotification({
        type: 'success',
        message: 'Profile picture updated successfully!'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error updating avatar:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update profile picture. Please try again.'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg">
            <h1 className="text-3xl font-bold text-primary text-center mb-4">Profile</h1>
            <p className="text-text-secondary text-center mb-8">Please log in to view your profile.</p>
            <Link href="/login" className="btn-primary w-full flex items-center justify-center">
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navbar />

      {/* Hero Section with Avatar */}
      <div className="relative bg-primary pt-32 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/food-pattern.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 to-primary"></div>
        <div className="relative container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-8">
              <AvatarUpload
                url={profileData.avatar_url}
                onUpload={handleAvatarUpload}
                size={160}
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                Level {profileData.current_level}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              {profileData.username}
            </h1>
            <p className="text-white/80 text-lg mb-8">@{profileData.username}</p>
            <div className="flex items-center gap-6 justify-center">
              <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl shadow-sm">
                <p className="text-white/60 text-sm">Experience Points</p>
                <p className="text-white font-semibold text-2xl">{profileData.experience_points}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl shadow-sm">
                <p className="text-white/60 text-sm">Member Since</p>
                <p className="text-white font-semibold text-2xl">
                  {profileData.created_at ? formatDate(new Date(profileData.created_at), 'MMM d, yyyy') : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-20 relative z-10 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Notification */}
          {notification && (
            <div 
              className={`p-4 rounded-xl border shadow-sm ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Profile Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                <p className="text-gray-500 text-sm mt-1">Your account details</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Username</div>
                  <div className="text-lg text-gray-900">{profileData.username}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Email Address</div>
                  <div className="text-lg text-gray-900">{profileData.email}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Member Since</div>
                  <div className="text-lg text-gray-900">
                    {profileData.created_at ? formatDate(new Date(profileData.created_at), 'MMMM d, yyyy') : 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your password and security preferences</p>
              </div>
              {!isChangingPassword && (
                <button
                  onClick={handlePasswordToggle}
                  className="text-accent hover:bg-accent hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                >
                  <FaKey />
                  Change Password
                </button>
              )}
            </div>

            <div className="p-6">
              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handlePasswordToggle}
                      className="px-6 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <FaTimes />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <FaSave />
                      Update Password
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl max-w-md">
                  <div className="flex items-center">
                    <FaKey className="text-accent text-xl mr-4" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Password Status</div>
                      <div className="text-lg text-gray-900">
                        Your password is secure
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary mt-auto py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-white">SAVORYCIRCLE</h3>
              <p className="text-white/70 text-sm">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            <div className="flex gap-6">
              <Link href="/" className="text-white/90 hover:text-white transition-colors text-sm">
                Home
              </Link>
              <Link href="/dashboard" className="text-white/90 hover:text-white transition-colors text-sm">
                Dashboard
              </Link>
              <Link href="/about" className="text-white/90 hover:text-white transition-colors text-sm">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 