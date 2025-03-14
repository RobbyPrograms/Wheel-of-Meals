'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { FavoriteFood, MealPlan } from '@/lib/supabase';

type DayMeal = {
  breakfast: FavoriteFood | null;
  lunch: FavoriteFood | null;
  dinner: FavoriteFood | null;
};

type WeeklyPlan = {
  [key: string]: DayMeal;
};

export default function MealPlanning() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [duration, setDuration] = useState<'one_week' | 'two_weeks'>('one_week');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [mealPlan, setMealPlan] = useState<WeeklyPlan | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);

  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Monday (Week 2)', 'Tuesday (Week 2)', 'Wednesday (Week 2)', 'Thursday (Week 2)', 'Friday (Week 2)', 'Saturday (Week 2)', 'Sunday (Week 2)'
  ];

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

  const generateMealPlan = () => {
    if (generatingPlan || favoriteFoods.length === 0) return;
    
    setGeneratingPlan(true);
    setMealPlan(null);
    setIngredients([]);
    
    // Determine how many days to generate
    const daysToGenerate = duration === 'one_week' ? 7 : 14;
    
    // Generate a random meal plan
    const plan: WeeklyPlan = {};
    const allIngredients = new Set<string>();
    
    for (let i = 0; i < daysToGenerate; i++) {
      const day = days[i];
      
      // Randomly select meals for each time of day
      const breakfast = getRandomFood();
      const lunch = getRandomFood();
      const dinner = getRandomFood();
      
      plan[day] = { breakfast, lunch, dinner };
      
      // Collect ingredients
      [breakfast, lunch, dinner].forEach(meal => {
        if (meal && meal.ingredients) {
          meal.ingredients.forEach(ingredient => allIngredients.add(ingredient));
        }
      });
    }
    
    setMealPlan(plan);
    setIngredients(Array.from(allIngredients).sort());
    setGeneratingPlan(false);
  };
  
  const getRandomFood = (): FavoriteFood | null => {
    if (favoriteFoods.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * favoriteFoods.length);
    return favoriteFoods[randomIndex];
  };

  const saveMealPlan = async () => {
    if (!mealPlan || !user) return;
    
    try {
      // Convert the meal plan to a format suitable for storage
      const meals = Object.entries(mealPlan).flatMap(([day, dayMeals]) => {
        return [
          dayMeals.breakfast,
          dayMeals.lunch,
          dayMeals.dinner
        ].filter(Boolean) as FavoriteFood[];
      });
      
      const { error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          meals,
          duration
        });
      
      if (error) {
        throw error;
      }
      
      alert('Meal plan saved successfully!');
    } catch (error) {
      console.error('Error saving meal plan:', error);
      alert('Failed to save meal plan');
    }
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
                  className="block px-4 py-2 rounded-md hover:bg-gray-100"
                >
                  Meal Wheel
                </Link>
                <Link
                  href="/dashboard/meal-plan"
                  className="block px-4 py-2 bg-secondary/10 text-secondary rounded-md hover:bg-secondary/20"
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
            <h1 className="text-2xl font-bold mb-6">Meal Planning</h1>
            
            {loadingFoods ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : favoriteFoods.length > 0 ? (
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4">Generate a Meal Plan</h2>
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="one_week"
                        name="duration"
                        value="one_week"
                        checked={duration === 'one_week'}
                        onChange={() => setDuration('one_week')}
                        className="mr-2"
                      />
                      <label htmlFor="one_week">One Week</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="two_weeks"
                        name="duration"
                        value="two_weeks"
                        checked={duration === 'two_weeks'}
                        onChange={() => setDuration('two_weeks')}
                        className="mr-2"
                      />
                      <label htmlFor="two_weeks">Two Weeks</label>
                    </div>
                  </div>
                  <button
                    onClick={generateMealPlan}
                    disabled={generatingPlan}
                    className="btn btn-primary"
                  >
                    {generatingPlan ? 'Generating...' : 'Generate Meal Plan'}
                  </button>
                </div>
                
                {mealPlan && (
                  <div>
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Your Meal Plan</h2>
                        <button
                          onClick={saveMealPlan}
                          className="btn btn-secondary"
                        >
                          Save Plan
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Day
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Breakfast
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Lunch
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dinner
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(mealPlan)
                              .slice(0, duration === 'one_week' ? 7 : 14)
                              .map(([day, meals]) => (
                                <tr key={day}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {day}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {meals.breakfast?.name || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {meals.lunch?.name || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {meals.dinner?.name || '-'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-bold mb-4">Shopping List</h2>
                      {ingredients.length > 0 ? (
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {ingredients.map((ingredient, index) => (
                            <li key={index} className="flex items-center">
                              <input type="checkbox" id={`ingredient-${index}`} className="mr-2" />
                              <label htmlFor={`ingredient-${index}`} className="text-gray-700">
                                {ingredient}
                              </label>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No ingredients found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 mb-4">You need to add some favorite foods before you can generate a meal plan.</p>
                <Link href="/dashboard/foods" className="btn btn-primary">
                  Add Foods
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 