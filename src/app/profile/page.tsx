'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaKey, FaSave, FaTimes } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';

type ProfileData = {
  name: string;
  email: string;
  username: string;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    username: ''
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
        username: ''
      });
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData(prev => ({
          ...prev,
          username: data.username
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <div className="relative bg-primary">
        <div className="absolute inset-0 bg-[url('/food-pattern.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 to-primary"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Your Profile</h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Manage your account information and preferences
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-primary to-transparent transform translate-y-24"></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 -mt-12 relative z-10">
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

          {/* Account Information Card */}
          <div className="bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-2">Account Information</h2>
                  <p className="text-text-secondary text-sm">Update your personal information</p>
                </div>
                <button 
                  onClick={handleEditToggle}
                  className={`flex items-center px-4 py-2 rounded-xl transition-all ${
                    isEditing
                      ? 'text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200'
                      : 'text-accent hover:text-white hover:bg-accent'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <FaTimes className="mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <FaEdit className="mr-2" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaUser className="text-accent" />
                      </div>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={profileData.username || ''}
                        onChange={handleProfileChange}
                        className="pl-11 w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        placeholder="Your username"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaUser className="text-accent" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        className="pl-11 w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaEnvelope className="text-accent" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="pl-11 w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        placeholder="Your email"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="btn-primary px-6"
                    >
                      <FaSave className="mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <FaUser className="text-accent text-xl mr-4" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Username</div>
                      <div className="text-lg font-medium text-gray-900">
                        {profileData.username || 'Not set'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <FaUser className="text-accent text-xl mr-4" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Name</div>
                      <div className="text-lg font-medium text-gray-900">
                        {profileData.name || 'Not set'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <FaEnvelope className="text-accent text-xl mr-4" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                      <div className="text-lg font-medium text-gray-900">
                        {profileData.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <FaCalendarAlt className="text-accent text-xl mr-4" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Account Created</div>
                      <div className="text-lg font-medium text-gray-900">
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-2">Security</h2>
                  <p className="text-text-secondary text-sm">Manage your password and security settings</p>
                </div>
                <button
                  onClick={handlePasswordToggle}
                  className={`flex items-center px-4 py-2 rounded-xl transition-all ${
                    isChangingPassword
                      ? 'text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200'
                      : 'text-accent hover:text-white hover:bg-accent'
                  }`}
                >
                  {isChangingPassword ? (
                    <>
                      <FaTimes className="mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <FaKey className="mr-2" />
                      Change Password
                    </>
                  )}
                </button>
              </div>

              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
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

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="btn-primary px-6"
                    >
                      <FaSave className="mr-2" />
                      Update Password
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <FaKey className="text-accent text-xl mr-4" />
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Password Status</div>
                      <div className="text-lg font-medium text-gray-900">
                        Last changed on {new Date().toLocaleDateString()}
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
      <footer className="bg-primary mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-display font-bold text-white">SAVORYCIRCLE</h3>
              <p className="text-white/70">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            <div className="flex gap-8">
              <Link href="/" className="text-white/90 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/dashboard" className="text-white/90 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/about" className="text-white/90 hover:text-white transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 