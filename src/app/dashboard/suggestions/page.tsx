'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getRecipeSuggestions, RecipeSuggestion } from '@/lib/deepseek';
import type { FavoriteFood } from '@/lib/supabase';

export default function AISuggestions() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        .eq('user_id', user?.id)
        .order('name');

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

  const handleFoodSelection = (foodName: string) => {
    setSelectedFoods(prev => {
      if (prev.includes(foodName)) {
        return prev.filter(name => name !== foodName);
      } else {
        return [...prev, foodName];
      }
    });
  };

  const handleGetSuggestions = async () => {
    if (loadingSuggestions || selectedFoods.length === 0) return;
    
    setLoadingSuggestions(true);
    setError(null);
    setSuggestions([]);
    
    try {
      const suggestions = await getRecipeSuggestions(selectedFoods, count);
      setSuggestions(suggestions);
    } catch (error: any) {
      setError(error.message || 'Failed to get recipe suggestions');
      console.error('Error getting recipe suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const saveRecipe = async (recipe: RecipeSuggestion) => {
    try {
      const { error } = await supabase
        .from('favorite_foods')
        .insert({
          user_id: user?.id,
          name: recipe.name,
          ingredients: recipe.ingredients
        });
      
      if (error) {
        throw error;
      }
      
      alert('Recipe saved to your favorite foods!');
      
      // Refresh the food list
      fetchFavoriteFoods();
    } catch (error: any) {
      alert(`Failed to save recipe: ${error.message}`);
      console.error('Error saving recipe:', error);
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
                  My Meals
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
                  className="block px-4 py-2 bg-secondary/10 text-secondary rounded-md hover:bg-secondary/20"
                >
                  AI Suggestions
                </Link>
              </nav>
            </div>
          </div>

          <div className="md:w-3/4">
            <h1 className="text-2xl font-bold mb-6">AI Recipe Suggestions</h1>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Get Creative Recipe Ideas</h2>
              
              {loadingFoods ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : favoriteFoods.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Select Ingredients</h3>
                    <div className="flex flex-wrap gap-2">
                      {favoriteFoods.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => handleFoodSelection(food.name)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            selectedFoods.includes(food.name)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {food.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Number of Suggestions</h3>
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={1}>1 Recipe</option>
                      <option value={2}>2 Recipes</option>
                      <option value={3}>3 Recipes</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleGetSuggestions}
                    disabled={loadingSuggestions || selectedFoods.length === 0}
                    className="btn btn-primary"
                  >
                    {loadingSuggestions ? 'Getting Suggestions...' : 'Get Recipe Suggestions'}
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">You need to add some favorite foods before you can get AI suggestions.</p>
                  <Link href="/dashboard/foods" className="btn btn-primary">
                    Add Foods
                  </Link>
                </div>
              )}
            </div>
            
            {suggestions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Your Recipe Suggestions</h2>
                <div className="space-y-6">
                  {suggestions.map((recipe, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-primary">{recipe.name}</h3>
                        <button
                          onClick={() => saveRecipe(recipe)}
                          className="btn btn-secondary text-sm"
                        >
                          Save to Favorites
                        </button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Ingredients</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {recipe.ingredients.map((ingredient, idx) => (
                              <li key={idx} className="text-gray-700">{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Instructions</h4>
                          <ol className="list-decimal list-inside space-y-1">
                            {recipe.instructions.map((step, idx) => (
                              <li key={idx} className="text-gray-700">{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Prep Time:</span> {recipe.prepTime}
                        </div>
                        <div>
                          <span className="font-semibold">Cook Time:</span> {recipe.cookTime}
                        </div>
                        <div>
                          <span className="font-semibold">Servings:</span> {recipe.servings}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 