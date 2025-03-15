'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MealPlansRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard with a query parameter to open the meal plans panel
    router.replace('/dashboard?panel=meal-plans');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
} 