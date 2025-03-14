'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { FavoriteFood } from '@/lib/supabase';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      // Fetch user's favorite foods
      fetchFavoriteFoods();
    }
  }, [user, loading, router]);

  const fetchFavoriteFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setFavoriteFoods(data || []);
    } catch (error) {
      console.error('Error fetching favorite foods:', error);
    } finally {
      setLoadingFoods(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary py-4">
        <div className="container flex justify-between items-center">
          <Link href="/" className="text-white text-xl font-bold">
            Wheel of Meals
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-white">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="btn bg-white text-primary hover:bg-white/90"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 bg-secondary/10 text-secondary rounded-md hover:bg-secondary/20"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/foods"
                  className="block px-4 py-2 rounded-md hover:bg-gray-100"
                >
                  My Foods
                </Link>
                <Link
                  href="/dashboard/wheel"
                  className="block px-4 py-2 rounded-md hover:bg-gray-100"
                >
                  Meal Wheel
                </Link>
                <Link
                  href="/dashboard/meal-plan"
                  className="block px-4 py-2 rounded-md hover:bg-gray-100"
                >
                  Meal Planning
                </Link>
                <Link
                  href="/dashboard/suggestions"
                  className="block px-4 py-2 rounded-md hover:bg-gray-100"
                >
                  AI Suggestions
                </Link>
              </nav>
            </div>
          </div>

          <div className="md:w-3/4">
            <h1 className="text-2xl font-bold mb-6">Welcome to Your Meal Dashboard</h1>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Your Favorite Foods</h2>
                {loadingFoods ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : favoriteFoods.length > 0 ? (
                  <ul className="space-y-2">
                    {favoriteFoods.map((food) => (
                      <li key={food.id} className="p-2 bg-gray-50 rounded-md">
                        {food.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">You haven't added any favorite foods yet.</p>
                    <Link href="/dashboard/foods" className="btn btn-primary">
                      Add Foods
                    </Link>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Quick Meal Wheel</h2>
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 border-4 border-primary rounded-full flex items-center justify-center mb-4">
                    <span className="text-lg font-bold">Spin Me!</span>
                  </div>
                  <Link href="/dashboard/wheel" className="btn btn-primary">
                    Go to Meal Wheel
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
                <h2 className="text-xl font-bold mb-4">Recent Meal Plans</h2>
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">You haven't created any meal plans yet.</p>
                  <Link href="/dashboard/meal-plan" className="btn btn-primary">
                    Create Meal Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 