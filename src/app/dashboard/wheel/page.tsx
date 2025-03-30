'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { FavoriteFood } from '@/lib/supabase';

export default function MealWheel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FavoriteFood | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

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

  const spinWheel = () => {
    if (spinning || favoriteFoods.length === 0) return;
    
    setSpinning(true);
    setSelectedFood(null);
    
    // Calculate a random rotation (between 5 and 10 full rotations plus a random position)
    const minRotations = 5;
    const maxRotations = 10;
    const randomRotations = Math.floor(Math.random() * (maxRotations - minRotations + 1) + minRotations);
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = randomRotations * 360 + randomAngle;
    
    // Set the new rotation angle
    setRotationAngle(rotationAngle + totalRotation);
    
    // After the animation completes, select a random food
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * favoriteFoods.length);
      setSelectedFood(favoriteFoods[randomIndex]);
      setSpinning(false);
    }, 3000); // Match this with the CSS transition duration
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
            SavoryCircle
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white hover:text-white/80">
              Dashboard
            </Link>
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
                  className="block px-4 py-2 rounded-md hover:bg-gray-100"
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
                  className="block px-4 py-2 bg-secondary/10 text-secondary rounded-md hover:bg-secondary/20"
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
            <h1 className="text-2xl font-bold mb-6">Meal Wheel</h1>
            
            {loadingFoods ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : favoriteFoods.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-8">
                  {/* Wheel */}
                  <div 
                    ref={wheelRef}
                    className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-primary relative overflow-hidden transition-transform duration-3000 ease-out"
                    style={{ transform: `rotate(${rotationAngle}deg)` }}
                  >
                    {/* Wheel segments */}
                    {favoriteFoods.map((food, index) => {
                      const segmentAngle = 360 / favoriteFoods.length;
                      const rotation = index * segmentAngle;
                      const skew = favoriteFoods.length <= 2 ? 0 : 90 - segmentAngle;
                      
                      return (
                        <div
                          key={food.id}
                          className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left text-white flex justify-center overflow-hidden"
                          style={{
                            transform: `rotate(${rotation}deg) skew(${skew}deg)`,
                            background: index % 2 === 0 ? '#FF6B6B' : '#FF8787',
                          }}
                        >
                          <div 
                            className="mt-2 mr-2 text-center font-bold text-xs transform -rotate-45 whitespace-nowrap overflow-hidden text-ellipsis"
                            style={{ maxWidth: '60px' }}
                          >
                            {food.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-accent z-10"></div>
                </div>
                
                <button
                  onClick={spinWheel}
                  disabled={spinning}
                  className="btn btn-primary px-8 py-3 text-lg mb-8"
                >
                  {spinning ? 'Spinning...' : 'Spin the Wheel'}
                </button>
                
                {selectedFood && (
                  <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
                    <h2 className="text-xl font-bold mb-2 text-center">Your Meal</h2>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary mb-4">{selectedFood.name}</p>
                      {selectedFood.ingredients && selectedFood.ingredients.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Ingredients:</h3>
                          <ul className="list-disc list-inside text-left">
                            {selectedFood.ingredients.map((ingredient, index) => (
                              <li key={index} className="text-gray-700">{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 mb-4">You need to add some favorite foods before you can use the meal wheel.</p>
                <Link href="/dashboard/foods" className="btn btn-primary">
                  Add Foods
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .transition-transform {
          transition: transform 3s cubic-bezier(0.17, 0.67, 0.83, 0.67);
        }
      `}</style>
    </div>
  );
} 