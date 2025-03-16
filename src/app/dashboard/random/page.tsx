'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { FavoriteFood } from '@/lib/supabase';
import MealWheel from '@/components/MealWheel';
import Link from 'next/link';

export default function RandomMeal() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFoods();
    }
  }, [user]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user?.id);

      if (fetchError) throw fetchError;

      setFoods(data || []);
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError('Failed to load your favorite foods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Random Meal Selector</h1>
          <p className="text-text-secondary mb-6">Please log in to use this feature.</p>
          <Link
            href="/login"
            className="inline-block bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your favorite foods...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Random Meal Selector</h1>
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
          <button
            onClick={fetchFoods}
            className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Random Meal Selector</h1>
          <p className="text-text-secondary mb-6">You haven't added any favorite foods yet.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
          >
            Add Some Foods
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Random Meal Selector</h1>
        <p className="text-text-secondary">
          Spin the wheel to get a random meal suggestion from your favorite foods!
        </p>
      </div>

      <MealWheel foods={foods} />
    </div>
  );
} 