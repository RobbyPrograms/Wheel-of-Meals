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
  description: 'Simplify your meal planning with SavoryCircle. Create custom meal schedules, discover new recipes, and organize your favorite dishes all in one place. Free meal planning tool for individuals and families.',
  metadataBase: new URL('https://savorycircle.com'), // Replace with your actual domain
  keywords: ['meal planning', 'recipe organization', 'food planner', 'meal scheduler', 'cooking', 'meal prep', 'recipe manager', 'meal ideas'],
  authors: [{ name: 'SavoryCircle' }],
  openGraph: {
    type: 'website',
    title: 'SavoryCircle - Modern Meal Planning Made Easy',
    description: 'Simplify your meal planning with SavoryCircle. Create custom meal schedules, discover new recipes, and organize your favorite dishes all in one place.',
    images: [
      {
        url: '/og-image.jpg', // You'll need to create this
        width: 1200,
        height: 630,
        alt: 'SavoryCircle - Modern Meal Planning Platform'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SavoryCircle - Modern Meal Planning Made Easy',
    description: 'Simplify your meal planning with SavoryCircle. Create custom meal schedules, discover new recipes, and organize your favorite dishes all in one place.',
    images: ['/og-image.jpg'], // Same image as OpenGraph
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // You'll get this from Google Search Console
  },
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