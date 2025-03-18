'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FaUtensils, FaCalendarAlt, FaRandom, FaChevronRight, FaLightbulb, FaUserFriends, FaCompass } from 'react-icons/fa';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { autoSetupDatabase } from '@/lib/auto-setup';
import FoodsPanel from '@/components/FoodsPanel';
import MealPlansPanel from '@/components/MealPlansPanel';
import MealPlansDashboard from '@/components/MealPlansDashboard';
import AISuggestions from '@/components/AISuggestions';

export default function Dashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [foodCount, setFoodCount] = useState<number | null>(null);
  const [mealPlanCount, setMealPlanCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentFoods, setRecentFoods] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSettingUpDatabase, setIsSettingUpDatabase] = useState(false);
  const [isFoodsPanelOpen, setIsFoodsPanelOpen] = useState(false);
  const [isMealPlansPanelOpen, setIsMealPlansPanelOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  // Check for query parameters to open panels and clear them after
  useEffect(() => {
    const panel = searchParams.get('panel');
    if (panel === 'foods') {
      setIsFoodsPanelOpen(true);
      router.replace('/dashboard');
    } else if (panel === 'meal-plans') {
      setIsMealPlansPanelOpen(true);
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  // Handle panel close
  const handleFoodsPanelClose = () => {
    setIsFoodsPanelOpen(false);
    router.replace('/dashboard');
  };

  const handleMealPlansPanelClose = () => {
    setIsMealPlansPanelOpen(false);
    router.replace('/dashboard');
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Get food count
      const { count: foodCountResult, error: foodError } = await supabase
        .from('favorite_foods')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (foodError) {
        if (foodError.code === '42P01') {
          throw new Error('Database tables not set up properly. Please try refreshing the page.');
        }
        throw foodError;
      }
      setFoodCount(foodCountResult);
      
      // Get meal plan count
      const { count: mealPlanCountResult, error: mealPlanError } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (mealPlanError) throw mealPlanError;
      setMealPlanCount(mealPlanCountResult);
      
      // Get recent foods
      const { data: recentFoodsData, error: recentFoodsError } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (recentFoodsError) throw recentFoodsError;
      setRecentFoods(recentFoodsData || []);
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRetryWithSetup = async () => {
    setIsSettingUpDatabase(true);
    setError(null);
    
    try {
      const setupSuccess = await autoSetupDatabase();
      
      if (setupSuccess) {
        await fetchDashboardData();
      } else {
        setError('Unable to set up database. Please try again later.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to set up database. Please try again later.');
    } finally {
      setIsSettingUpDatabase(false);
    }
  };

  const handleDataUpdated = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const handleMealPlanView = useCallback((planId?: string) => {
    setIsMealPlansPanelOpen(true);
  }, []);

  const handleAddToFavorites = async (meal: { name: string; description: string; recipe: string }) => {
    try {
      const { error } = await supabase
        .from('favorite_foods')
        .insert([
          {
            name: meal.name,
            ingredients: meal.description,
            recipe: meal.recipe,
            user_id: user?.id
          }
        ]);

      if (error) throw error;
      await fetchDashboardData();
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-primary">
          Welcome to your dashboard
        </h1>
        <div className="bg-accent bg-opacity-10 text-accent text-xs px-3 py-1">Level 1 Chef</div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <button 
          onClick={() => setIsFoodsPanelOpen(true)}
          className="border border-border hover:shadow-medium transition-all duration-300 text-left"
        >
          <div className="p-6">
            <div className="bg-accent text-light w-12 h-12 flex items-center justify-center rounded-full mb-4">
              <FaUtensils className="text-xl" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-primary">My Foods</h3>
            <p className="text-text-secondary text-sm mb-4">Manage your favorite meals and ingredients</p>
            <div className="flex items-center text-accent text-sm font-medium">
              <span>View Details</span>
              <FaChevronRight className="ml-2 text-xs" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setIsMealPlansPanelOpen(true)}
          className="border border-border hover:shadow-medium transition-all duration-300 text-left"
        >
          <div className="p-6">
            <div className="bg-highlight text-light w-12 h-12 flex items-center justify-center rounded-full mb-4">
              <FaCalendarAlt className="text-xl" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-primary">Meal Plans</h3>
            <p className="text-text-secondary text-sm mb-4">Create and view your meal schedules</p>
            <div className="flex items-center text-accent text-sm font-medium">
              <span>View Details</span>
              <FaChevronRight className="ml-2 text-xs" />
            </div>
          </div>
        </button>

        <Link
          href="/dashboard/random"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FaRandom className="text-accent text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Random Meal</h3>
          <p className="text-text-secondary">
            Get a random meal suggestion from your favorites
          </p>
        </Link>

        <Link
          href="/dashboard/friends"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FaUserFriends className="text-accent text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Friends</h3>
          <p className="text-text-secondary">
            Connect with friends and discover their favorite meals
          </p>
        </Link>

        <Link
          href="/dashboard/explore"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <FaCompass className="text-2xl text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Explore</h3>
              <p className="text-text-secondary">Discover meals from your friends</p>
            </div>
          </div>
        </Link>

        <button 
          onClick={() => setIsAIPanelOpen(true)}
          className="border border-border hover:shadow-medium transition-all duration-300 text-left"
        >
          <div className="p-6">
            <div className="bg-primary text-light w-12 h-12 flex items-center justify-center rounded-full mb-4">
              <FaLightbulb className="text-xl" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-primary">AI Suggestions</h3>
            <p className="text-text-secondary text-sm mb-4">Get personalized meal ideas</p>
            <div className="flex items-center text-accent text-sm font-medium">
              <span>View Details</span>
              <FaChevronRight className="ml-2 text-xs" />
            </div>
          </div>
        </button>
      </div>

      {/* Activity Overview */}
      <div className="mb-10">
        <h2 className="text-lg font-medium text-primary mb-6">Activity Overview</h2>
        {error ? (
          <div className="text-center py-8 border border-border">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={handleRetryWithSetup}
              className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-dark transition-colors"
              disabled={isSettingUpDatabase}
            >
              {isSettingUpDatabase ? 'Setting up...' : 'Retry with Setup'}
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border border-border p-4">
                <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-2">TOTAL FOODS</h3>
                <div className="text-4xl font-medium text-accent">{foodCount || 0}</div>
                <p className="text-text-secondary text-sm mt-2">Saved favorite meals</p>
              </div>
              
              <div 
                className="border border-border p-4 cursor-pointer hover:border-highlight transition-colors"
                onClick={() => setIsMealPlansPanelOpen(true)}
              >
                <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-2">MEAL PLANS</h3>
                <div className="text-4xl font-medium text-highlight">{mealPlanCount || 0}</div>
                <p className="text-text-secondary text-sm mt-2">Created meal schedules</p>
              </div>
            </div>
            
            <div className="border border-border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs uppercase tracking-wider text-text-secondary">PROGRESS</h3>
                <div className="bg-accent bg-opacity-10 text-accent text-xs px-2 py-0.5">Level 1</div>
              </div>
              <div className="w-full bg-border h-2 mb-2">
                <div 
                  className="bg-accent h-2"
                  style={{ width: '25%' }}
                ></div>
              </div>
              <p className="text-text-secondary text-sm">25% to Level 2 - Add more meals to level up!</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Foods Section */}
      <div className="mb-10">
        <div className="border border-border p-6 h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-primary">Recent Foods</h2>
            <button 
              onClick={() => setIsFoodsPanelOpen(true)}
              className="text-accent hover:text-highlight text-sm flex items-center"
            >
              View All <FaChevronRight className="ml-1 text-xs" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentFoods.length > 0 ? (
            <div className="space-y-4">
              {recentFoods.map((food) => (
                <div key={food.id} className="border-b border-border pb-4">
                  <h3 className="font-medium text-primary">{food.name}</h3>
                  <p className="text-sm text-text-secondary truncate">
                    {food.ingredients || 'No ingredients listed'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-4">No foods added yet</p>
              <button 
                onClick={() => setIsFoodsPanelOpen(true)}
                className="bg-accent text-light px-4 py-2 inline-block hover:bg-highlight transition-colors"
              >
                Add Your First Food
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panels */}
      <FoodsPanel 
        isOpen={isFoodsPanelOpen} 
        onClose={handleFoodsPanelClose} 
        onFoodAdded={handleDataUpdated}
      />
      
      <MealPlansPanel 
        isOpen={isMealPlansPanelOpen} 
        onClose={handleMealPlansPanelClose} 
        onMealPlanAdded={handleDataUpdated}
      />

      {/* AI Suggestions Panel */}
      {isAIPanelOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">AI Meal Suggestions</h2>
              <button
                onClick={() => setIsAIPanelOpen(false)}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <AISuggestions onAddToFavorites={handleAddToFavorites} />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 