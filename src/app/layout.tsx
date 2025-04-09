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
  keywords: ['meal planning', 'recipe organization', 'food planner', 'meal scheduler', 'cooking', 'meal prep', 'recipe manager', 'meal ideas', 'AI Meal Planner', 'AI Recipe Generator', 'AI Recipe Search', 'AI Recipe Suggestions', 'AI Recipe Recommendations', 'AI Recipe Suggestions', 'AI Recipe Recommendations', 'AI Recipe Suggestions', 'AI Recipe Recommendations', 'Free Meal Planner', 'Free Recipe Planner', 'Free Recipe Organizer', 'Free Recipe Manager', 'Free Recipe Search', 'Free Recipe Suggestions', 'Free Recipe Recommendations', 'Recipe Sharing', 'Recipe Collection', 'Recipe Management', 'Recipe Search', 'Recipe Suggestions', 'Recipe Recommendations', 'Recipe Sharing', 'Recipe Collection', 'Recipe Management', 'Recipe Search', 'Recipe Suggestions', 'Recipe Recommendations'],
  authors: [{ name: 'SavoryCircle' }],
  openGraph: {
    type: 'website',
    title: 'SavoryCircle - Modern Meal Planning Made Easy',
    description: 'Simplify your meal planning with SavoryCircle. Create custom meal schedules, discover new recipes, and organize your favorite dishes all in one place.',
    siteName: 'SavoryCircle',
    images: [
      {
        url: '/logo.svg',
        type: 'image/svg+xml',
        width: 512,
        height: 512,
        alt: 'SavoryCircle - Modern Meal Planning Platform'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SavoryCircle - Modern Meal Planning Made Easy',
    description: 'Simplify your meal planning with SavoryCircle. Create custom meal schedules, discover new recipes, and organize your favorite dishes all in one place.',
    images: ['/logo.svg'],
    site: '@savorycircle', // Replace with your Twitter handle
    creator: '@savorycircle', // Replace with your Twitter handle
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
    google: 'MHnBtsYcoex9jc5gg0BuMayX_qzG2DyIQP8gs4Rw1_Y',
  },
  icons: {
    icon: [
      {
        url: '/logo.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: '/logo.svg',
    apple: '/logo.svg',
    other: [
      {
        rel: 'mask-icon',
        url: '/logo.svg',
        color: '#319141',
      },
    ],
  },
  manifest: '/manifest.json',
  applicationName: 'SavoryCircle',
  appleWebApp: {
    capable: true,
    title: 'SavoryCircle',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
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
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
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