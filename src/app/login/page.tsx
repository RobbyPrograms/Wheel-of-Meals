'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FaHatWizard, FaLock, FaEnvelope } from 'react-icons/fa';
import Navbar from '@/components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Redirect to dashboard on successful login
      router.push('/dashboard');
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
          <h1 className="wizard-title text-center mb-6">Wizard Login</h1>
          
          {error && (
            <div className="border-3 border-danger bg-game-darker text-danger px-4 py-3 mb-4">
              {error}
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
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full wizard-btn-primary py-2"
            >
              {loading ? 'Casting Spell...' : 'Enter the Realm'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <div className="magical-divider"></div>
            <p className="text-game-text-alt mt-4">
              No magical powers yet?{' '}
              <Link href="/signup" className="text-game-accent hover:underline magical-text">
                Become a Wizard
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 