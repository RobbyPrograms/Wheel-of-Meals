'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaKey, FaSave, FaTimes } from 'react-icons/fa';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
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
      });
    }
  }, [user]);

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
    
    // This is a placeholder - in a real app, you would update the user profile
    // through Supabase or your backend
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>
            <p className="mb-8">Please log in to view your profile.</p>
            <Link href="/login" className="btn-primary">
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <section className="pt-32 pb-20 bg-primary text-light">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Your Profile</h1>
              <p className="text-xl opacity-90">
                Manage your account information and preferences
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {notification && (
                <div className={`mb-6 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {notification.message}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="p-6 md:p-8 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">Account Information</h2>
                    <button 
                      onClick={handleEditToggle}
                      className="flex items-center text-accent hover:text-primary transition-colors"
                    >
                      {isEditing ? (
                        <>
                          <FaTimes className="mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <FaEdit className="mr-2" />
                          Edit
                        </>
                      )}
                    </button>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleProfileSubmit}>
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaUser className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={profileData.name}
                              onChange={handleProfileChange}
                              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                              placeholder="Your name"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaEnvelope className="text-gray-400" />
                            </div>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={profileData.email}
                              onChange={handleProfileChange}
                              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                              placeholder="Your email"
                              disabled
                            />
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="btn-primary flex items-center"
                          >
                            <FaSave className="mr-2" />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <FaUser className="text-accent mt-1 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Name</h3>
                          <p className="mt-1 text-lg">{profileData.name || 'Not set'}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaEnvelope className="text-accent mt-1 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email</h3>
                          <p className="mt-1 text-lg">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <FaCalendarAlt className="text-accent mt-1 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
                          <p className="mt-1 text-lg">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">Security</h2>
                    <button 
                      onClick={handlePasswordToggle}
                      className="flex items-center text-accent hover:text-primary transition-colors"
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
                    <form onSubmit={handlePasswordSubmit}>
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                            required
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="btn-primary flex items-center"
                          >
                            <FaSave className="mr-2" />
                            Update Password
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <p className="text-gray-600">
                      Your password was last changed on {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-light py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-xl font-display font-bold text-light">WHEEL OF MEALS</h3>
              <p className="text-light text-opacity-70">© {new Date().getFullYear()} All rights reserved</p>
            </div>
            <div className="flex gap-8">
              <Link href="/" className="text-light hover:text-highlight transition-colors">
                Home
              </Link>
              <Link href="/dashboard" className="text-light hover:text-highlight transition-colors">
                Dashboard
              </Link>
              <Link href="/about" className="text-light hover:text-highlight transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 