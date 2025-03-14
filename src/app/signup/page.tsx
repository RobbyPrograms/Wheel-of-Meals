'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FaHatWizard, FaLock, FaEnvelope, FaCheck, FaMagic } from 'react-icons/fa';
import Navbar from '@/components/Navbar';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
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
      const { error } = await signUp(email, password);
      
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
    <div className="min-h-screen flex flex-col bg-wizard-gradient scanline">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="wizard-container max-w-md w-full">
          <div className="flex justify-center mb-4">
            <FaHatWizard className="text-5xl text-game-accent animate-float" />
          </div>
          <h1 className="wizard-title text-center mb-6">Join the Wizards</h1>
          
          {error && (
            <div className="border-3 border-danger bg-game-darker text-danger px-4 py-3 mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="border-3 border-success bg-game-darker text-success px-4 py-3 mb-4 flex items-center">
              <FaCheck className="mr-2" /> <span className="magical-text">Your magical powers are ready! Entering the realm...</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="flex items-center text-sm font-pixel text-game-accent mb-2">
                <FaEnvelope className="mr-2" /> Magic Scroll
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="wizard-input w-full"
                placeholder="your@magic.spell"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="flex items-center text-sm font-pixel text-game-accent mb-2">
                <FaLock className="mr-2" /> Secret Incantation
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="wizard-input w-full"
                placeholder="••••••••"
              />
              <p className="text-xs mt-1 text-game-text-alt">Must be at least 6 magical characters</p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="flex items-center text-sm font-pixel text-game-accent mb-2">
                <FaMagic className="mr-2" /> Confirm Incantation
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="wizard-input w-full"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || success}
              className="w-full wizard-btn-primary py-2"
            >
              {loading ? 'Casting Spell...' : 'Become a Wizard'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <div className="magical-divider"></div>
            <p className="text-game-text-alt mt-4">
              Already a wizard?{' '}
              <Link href="/login" className="text-game-accent hover:underline magical-text">
                Enter the Realm
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 