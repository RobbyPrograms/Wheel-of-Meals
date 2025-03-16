'use client';

import { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from './Navbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardHome = pathname === '/dashboard';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-light">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {isDashboardHome ? (
          <div className="bg-light/95 backdrop-blur-md rounded-lg shadow-md">
            <div className="grid gap-6 p-6">
              {children}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-light/95 backdrop-blur-md rounded-lg shadow-md p-6">
                <DashboardSidebar />
              </div>
            </div>
            <div className="lg:col-span-9">
              <div className="bg-light/95 backdrop-blur-md rounded-lg shadow-md p-6">
                {children}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 