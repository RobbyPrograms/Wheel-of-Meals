'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FaHatWizard, FaLock, FaEnvelope, FaCheck, FaMagic, FaUser } from 'react-icons/fa';
import Navbar from '@/components/Navbar';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
      setError('Your incantations do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Your spell must be at least 6 characters long');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await signUp(email, password, username || undefined);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Show success message
      setSuccess(true);
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('A magical disturbance occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('/food-pattern.png')] opacity-5 rounded-3xl"></div>
          
          {/* Signup Container */}
          <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <FaHatWizard className="text-4xl text-accent" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">Join the Wizards</h1>
              <p className="text-text-secondary">Begin your magical culinary journey</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg flex items-center">
                <FaCheck className="text-green-500 mr-2" />
                <p className="text-green-700">Your magical powers are ready! Entering the realm...</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="flex items-center text-sm font-medium text-text-secondary mb-2">
                  <FaUser className="mr-2 text-accent" /> Choose Your Wizard Name (Optional)
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                  placeholder="wizardname (optional)"
                  pattern="^[a-zA-Z0-9_]+$"
                  minLength={3}
                />
                <p className="mt-1 text-sm text-text-secondary">Letters, numbers, and underscores only (optional)</p>
              </div>

              <div>
                <label htmlFor="email" className="flex items-center text-sm font-medium text-text-secondary mb-2">
                  <FaEnvelope className="mr-2 text-accent" /> Magic Scroll (Email)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                  placeholder="your@magic.spell"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="flex items-center text-sm font-medium text-text-secondary mb-2">
                  <FaLock className="mr-2 text-accent" /> Secret Incantation
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="mt-1 text-sm text-text-secondary">Must be at least 6 magical characters</p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="flex items-center text-sm font-medium text-text-secondary mb-2">
                  <FaMagic className="mr-2 text-accent" /> Confirm Incantation
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-accent hover:bg-highlight text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Casting Spell...
                  </div>
                ) : (
                  'Become a Wizard'
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-text-secondary">Already a wizard?</span>
                </div>
              </div>
              <Link 
                href="/login" 
                className="inline-block mt-4 text-accent hover:text-highlight transition-colors duration-200"
              >
                Enter the Realm
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 