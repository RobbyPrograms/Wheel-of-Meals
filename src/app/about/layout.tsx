import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About SavoryCircle - Modern Meal Planning Made Easy',
  description: 'Learn how SavoryCircle is revolutionizing meal planning with AI-powered suggestions, community features, and intuitive tools. Join thousands of satisfied users in simplifying their meal planning journey.',
  keywords: ['meal planning app', 'food planning', 'recipe organization', 'meal scheduler', 'AI meal planner'],
  openGraph: {
    title: 'About SavoryCircle - Modern Meal Planning Made Easy',
    description: 'Learn how SavoryCircle is revolutionizing meal planning with AI-powered suggestions, community features, and intuitive tools.',
    type: 'website',
    images: [
      {
        url: '/og-about.jpg', // You'll need to add this image
        width: 1200,
        height: 630,
        alt: 'SavoryCircle - Modern Meal Planning Platform'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About SavoryCircle - Modern Meal Planning Made Easy',
    description: 'Learn how SavoryCircle is revolutionizing meal planning with AI-powered suggestions, community features, and intuitive tools.',
    images: ['/og-about.jpg'], // Same image as OpenGraph
  }
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 