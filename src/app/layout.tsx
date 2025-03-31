import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SavoryCircle - Modern Meal Planning',
  description: 'Discover new meals and plan your next culinary adventure with SavoryCircle.',
  icons: {
    icon: [
      {
        url: '/logo.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: '32x32',
      }
    ],
    apple: '/logo.svg',
  },
};

// Client component for dark mode initialization
function ClientLayout({ children }: { children: React.ReactNode }) {
  'use client';
  
  const initializeDarkMode = () => {
    try {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (_) {}
  };

  // Run on mount
  if (typeof window !== 'undefined') {
    initializeDarkMode();
  }

  return (
    <AuthProvider>
      <div>
        {children}
      </div>
    </AuthProvider>
  );
}

// Server component (default export)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen">
        <ClientLayout>
          {children}
          <Analytics />
          <SpeedInsights />
        </ClientLayout>
      </body>
    </html>
  );
} 