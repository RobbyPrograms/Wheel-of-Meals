'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FaUser, FaEnvelope, FaLock, FaCheck } from 'react-icons/fa';
import Navbar from '@/components/Navbar';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate username if provided
    if (username) {
      if (username.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return;
      }
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await signUp(email, password, username || undefined);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Show success message and email confirmation
      setSuccess(true);
      setEmailSent(true);
      
      // Don't redirect - wait for email confirmation
    } catch (err) {
      setError('An error occurred during signup');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-[380px] mx-auto">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('/food-pattern.png')] opacity-5 rounded-2xl sm:rounded-3xl"></div>
          
          {/* Signup Container */}
          <div className="relative bg-white/80 backdrop-blur-sm p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#319141] mb-2">Join SavoryCircle</h1>
              <p className="text-sm sm:text-base text-gray-600">Start your culinary adventure today</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-6 rounded-lg text-sm">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {success && emailSent && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 mb-6 rounded-lg text-sm">
                <div className="flex items-center mb-2">
                  <FaCheck className="text-green-500 mr-2" />
                  <p className="text-green-700 font-medium">Account created successfully!</p>
                </div>
                <p className="text-gray-600">
                  We've sent a confirmation email to <strong>{email}</strong>. 
                  Please check your inbox and click the link to activate your account.
                </p>
              </div>
            )}
            
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="username" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                    <FaUser className="mr-2 text-[#319141]" /> Choose Your Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:border-[#319141] focus:ring-2 focus:ring-[#319141]/20 transition-all duration-200 text-sm sm:text-base"
                    placeholder="username (optional)"
                    pattern="^[a-zA-Z0-9_]+$"
                    minLength={3}
                  />
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">Letters, numbers, and underscores only (optional)</p>
                </div>

                <div>
                  <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                    <FaEnvelope className="mr-2 text-[#319141]" /> Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:border-[#319141] focus:ring-2 focus:ring-[#319141]/20 transition-all duration-200 text-sm sm:text-base"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                    <FaLock className="mr-2 text-[#319141]" /> Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:border-[#319141] focus:ring-2 focus:ring-[#319141]/20 transition-all duration-200 text-sm sm:text-base"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">Must be at least 6 characters</p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                    <FaLock className="mr-2 text-[#319141]" /> Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:border-[#319141] focus:ring-2 focus:ring-[#319141]/20 transition-all duration-200 text-sm sm:text-base"
                    placeholder="••••••••"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full bg-[#319141] hover:bg-[#319141]/90 text-white font-medium py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}
            
            {success && (
              <div className="text-center mt-6">
                <p className="text-gray-600 mb-4">
                  Can't find the email? Check your spam folder or{' '}
                  <button 
                    onClick={() => router.push('/login')} 
                    className="text-[#319141] hover:underline"
                  >
                    try signing in
                  </button>
                </p>
                <Link 
                  href="/" 
                  className="inline-block text-[#319141] hover:text-[#319141]/80 transition-colors duration-200 text-sm sm:text-base"
                >
                  Return to Home
                </Link>
              </div>
            )}
            
            {!success && (
              <div className="mt-6 sm:mt-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 text-gray-600 text-xs sm:text-sm">Already have an account?</span>
                  </div>
                </div>
                <Link 
                  href="/login" 
                  className="inline-block mt-3 sm:mt-4 text-[#319141] hover:text-[#319141]/80 transition-colors duration-200 text-sm sm:text-base"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 