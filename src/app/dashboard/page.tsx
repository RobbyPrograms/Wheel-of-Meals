'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FaUtensils, FaCalendarAlt, FaRandom, FaChevronRight, FaLightbulb, FaUserFriends, FaCompass, FaTrophy, FaStar } from 'react-icons/fa';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { autoSetupDatabase } from '@/lib/auto-setup';
import FoodsPanel from '@/components/FoodsPanel';
import MealPlansPanel from '@/components/MealPlansPanel';
import MealPlansDashboard from '@/components/MealPlansDashboard';
import AISuggestions from '@/components/AISuggestions';

interface LevelInfo {
  current_level: number;
  current_title: string;
  current_icon: string;
  current_division: number;
  current_xp: number;
  xp_for_next_level: number;
  progress_percentage: number;
  rewards: string[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [foodCount, setFoodCount] = useState<number | null>(null);
  const [mealPlanCount, setMealPlanCount] = useState<number | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
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

      // Fetch level info
      const { data: levelInfoData, error: levelInfoError } = await supabase
        .rpc('get_level_progress', { user_id: user.id });
      if (!levelInfoError && levelInfoData) {
        setLevelInfo(levelInfoData[0]);
      }
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

  const handleAddToFavorites = async (meal: { 
    name: string; 
    description: string; 
    recipe: string;
    visibility: 'public' | 'private';
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorite_foods')
        .insert({
          user_id: user.id,
          name: meal.name,
          ingredients: meal.description.split(',').map(i => i.trim()),
          recipe: meal.recipe,
          visibility: meal.visibility
        });

      if (error) throw error;

      // Refresh data after adding
      handleDataUpdated();
    } catch (err) {
      console.error('Error adding meal to favorites:', err);
      setError('Failed to add meal to favorites');
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
        {levelInfo && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-accent bg-opacity-10 text-accent px-4 py-2 rounded-lg">
              <span className="text-2xl">{levelInfo.current_icon}</span>
              <div>
                <div className="font-medium">{levelInfo.current_title}</div>
                <div className="text-xs">Division {levelInfo.current_division}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-xs uppercase tracking-wider text-text-secondary mb-1">CURRENT XP</div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-accent">{levelInfo.current_xp}</div>
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <FaStar className="text-yellow-400" />
                  <span>+{levelInfo.xp_for_next_level - levelInfo.current_xp} to next level</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* My Foods Card */}
        <Link 
          href="/dashboard/foods"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FaUtensils className="text-accent text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">My Foods</h3>
          <p className="text-text-secondary text-sm mb-4">
            Manage your favorite meals and ingredients
          </p>
          <div className="flex items-center text-accent text-sm font-medium">
            <span>View Details</span>
            <FaChevronRight className="ml-2 text-xs" />
          </div>
        </Link>

        {/* Meal Plans Card */}
        <Link 
          href="/dashboard/meal-plans"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FaCalendarAlt className="text-accent text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Meal Plans</h3>
          <p className="text-text-secondary text-sm mb-4">
            Create and manage your meal schedules
          </p>
          <div className="flex items-center text-accent text-sm font-medium">
            <span>View Details</span>
            <FaChevronRight className="ml-2 text-xs" />
          </div>
        </Link>

        {/* My Progress Card */}
        <Link 
          href="/dashboard/progress"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FaTrophy className="text-accent text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">My Progress</h3>
          <p className="text-text-secondary text-sm mb-4">
            Track your cooking journey and achievements
          </p>
          <div className="flex items-center text-accent text-sm font-medium">
            <span>View Details</span>
            <FaChevronRight className="ml-2 text-xs" />
          </div>
        </Link>

        {/* Random Meal Card */}
        <Link 
          href="/dashboard/random"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FaRandom className="text-accent text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Random Meal</h3>
          <p className="text-text-secondary text-sm mb-4">
            Get a random meal suggestion from your favorites
          </p>
          <div className="flex items-center text-accent text-sm font-medium">
            <span>View Details</span>
            <FaChevronRight className="ml-2 text-xs" />
          </div>
        </Link>

        {/* Friends Card */}
        <Link 
          href="/dashboard/friends"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FaUserFriends className="text-accent text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Friends</h3>
          <p className="text-text-secondary text-sm mb-4">
            Connect with friends and discover their favorite meals
          </p>
          <div className="flex items-center text-accent text-sm font-medium">
            <span>View Details</span>
            <FaChevronRight className="ml-2 text-xs" />
          </div>
        </Link>

        {/* AI Suggestions Card */}
        <div 
          onClick={() => setIsAIPanelOpen(true)}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <FaLightbulb className="text-accent text-xl" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">AI Suggestions</h3>
          <p className="text-text-secondary text-sm mb-4">
            Chat with AI to get personalized recipe ideas
          </p>
          <div className="flex items-center text-accent text-sm font-medium">
            <span>Open Chat</span>
            <FaChevronRight className="ml-2 text-xs" />
          </div>
        </div>
      </div>

      {/* Stats and Progress Section */}
      {user && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-2">TOTAL FOODS</h3>
              <div className="text-4xl font-medium text-accent">{foodCount || 0}</div>
              <p className="text-text-secondary text-sm mt-2">Saved favorite meals</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-2">MEAL PLANS</h3>
              <div className="text-4xl font-medium text-highlight">{mealPlanCount || 0}</div>
              <p className="text-text-secondary text-sm mt-2">Created meal schedules</p>
            </div>
          </div>
          
          {levelInfo && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-1">PROGRESS</h3>
                  <div className="text-lg font-medium text-primary flex items-center gap-2">
                    {levelInfo.current_title}
                    <span className="text-2xl">{levelInfo.current_icon}</span>
                    <span className="text-sm text-text-secondary">Division {levelInfo.current_division}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-lg font-medium">{levelInfo.current_xp} XP</span>
                </div>
              </div>
              
              <div className="relative w-full h-4 bg-border rounded-full mb-3 overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${levelInfo.progress_percentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <p className="text-text-secondary">
                  {levelInfo.current_xp} / {levelInfo.xp_for_next_level} XP
                </p>
                <p className="text-accent font-medium">
                  {levelInfo.progress_percentage}% to next level
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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
              <h2 className="text-2xl font-bold text-primary">Chat with AI Chef</h2>
              <button
                onClick={() => setIsAIPanelOpen(false)}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <AISuggestions onAddToFavorites={(meal) => {
                handleAddToFavorites(meal);
                // Optional: Close the panel after adding to favorites
                // setIsAIPanelOpen(false);
              }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 