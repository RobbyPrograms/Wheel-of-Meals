'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function SetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading, redirect to dashboard
    if (!loading) {
      // Add a small delay to ensure any auto-setup has time to complete
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Database setup is now automatic. Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );
} 