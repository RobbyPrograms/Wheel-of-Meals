'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FaUtensils, FaCalendarAlt, FaRandom, FaChevronRight, FaLightbulb, FaUserFriends, FaCompass, FaTrophy, FaStar, FaDice, FaRobot } from 'react-icons/fa';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { autoSetupDatabase } from '@/lib/auto-setup';
import FoodsPanel from '@/components/FoodsPanel';
import MealPlansPanel from '@/components/MealPlansPanel';
import MealPlansDashboard from '@/components/MealPlansDashboard';
import AISuggestions from '@/components/AISuggestions';
import LevelCard from '@/components/LevelCard';
import FoodDetailsModal from '@/components/FoodDetailsModal';

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
  const [selectedFood, setSelectedFood] = useState<any>(null);

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
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto">
      {/* Main Content Area */}
      <div className="w-full">
        {/* Welcome Section */}
        <div className="w-full px-4 sm:px-6 mb-6">
          <div className="bg-gradient-to-br from-[#319141]/10 via-white to-[#319141]/5 rounded-2xl border border-[#319141]/20">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="text-center md:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1E0F] mb-2">
                    Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
                  </h1>
                  <p className="text-gray-600">What would you like to cook today?</p>
                </div>
                
                {levelInfo && (
                  <div className="w-full md:w-auto md:min-w-[320px]">
                    <LevelCard
                      currentXP={levelInfo.current_xp}
                      division={levelInfo.current_title}
                      xpToNextLevel={Math.max(0, levelInfo.xp_for_next_level - levelInfo.current_xp)}
                      icon={levelInfo.current_icon}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="w-full px-4 sm:px-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
            {/* My Foods Card */}
            <Link 
              href="/dashboard/foods"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-300 hover:bg-[#319141]/5 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#319141]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUtensils className="text-[#319141] text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0F1E0F]">My Foods</h3>
                  <p className="text-gray-600 text-sm">
                    Manage your favorite meals and ingredients
                  </p>
                </div>
                <FaChevronRight className="text-gray-400" />
              </div>
            </Link>

            {/* Meal Plans Card */}
            <Link 
              href="/dashboard/meal-plans"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-300 hover:bg-[#319141]/5 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#319141]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCalendarAlt className="text-[#319141] text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0F1E0F]">Meal Plans</h3>
                  <p className="text-gray-600 text-sm">
                    Create and manage your meal schedules
                  </p>
                </div>
                <FaChevronRight className="text-gray-400" />
              </div>
            </Link>

            {/* Explore Card */}
            <Link 
              href="/dashboard/explore"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-300 hover:bg-[#319141]/5 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#319141]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCompass className="text-[#319141] text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0F1E0F]">Explore</h3>
                  <p className="text-gray-600 text-sm">
                    Discover new meals and cuisines
                  </p>
                </div>
                <FaChevronRight className="text-gray-400" />
              </div>
            </Link>

            {/* Friends Card */}
            <Link 
              href="/dashboard/friends"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-300 hover:bg-[#319141]/5 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#319141]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUserFriends className="text-[#319141] text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0F1E0F]">Friends</h3>
                  <p className="text-gray-600 text-sm">
                    Connect with friends and share meals
                  </p>
                </div>
                <FaChevronRight className="text-gray-400" />
              </div>
            </Link>

            {/* Random Meal Card */}
            <Link 
              href="/dashboard/random"
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-300 hover:bg-[#319141]/5 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#319141]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaDice className="text-[#319141] text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0F1E0F]">Random Meal</h3>
                  <p className="text-gray-600 text-sm">
                    Let us pick your next meal for you
                  </p>
                </div>
                <FaChevronRight className="text-gray-400" />
              </div>
            </Link>

            {/* AI Suggestions Card */}
            <div 
              onClick={() => setIsAIPanelOpen(true)}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-300 hover:bg-[#319141]/5 w-full cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#319141]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-[#319141] text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0F1E0F]">AI Suggestions</h3>
                  <p className="text-gray-600 text-sm">
                    Get personalized meal recommendations
                  </p>
                </div>
                <FaChevronRight className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Progress Section */}
        <div className="w-full px-4 sm:px-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[1200px] mx-auto">
            {/* Total Foods Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-4xl font-semibold text-[#0F1E0F]">{foodCount || 0}</div>
              <p className="text-gray-600 mt-1">Saved favorite meals</p>
            </div>
            
            {/* Meal Plans Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-4xl font-semibold text-[#0F1E0F]">{mealPlanCount || 0}</div>
              <p className="text-gray-600 mt-1">Created meal schedules</p>
            </div>
          </div>
        </div>

        {/* Recent Foods Section */}
        <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F1E0F]">Recent Foods</h2>
                  <p className="text-sm text-gray-600">Your latest added meals</p>
                </div>
                <Link href="/dashboard/foods" className="text-[#319141] text-sm hover:text-[#0F1E0F] transition-colors">
                  View All →
                </Link>
              </div>
              <div className="space-y-2">
                {recentFoods.map((food) => (
                  <div 
                    key={food.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                    onClick={() => setSelectedFood(food)}
                  >
                    <div>
                      <h3 className="font-medium text-[#0F1E0F]">{food.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{food.ingredients.join(', ')}</p>
                    </div>
                    <span className="text-sm text-gray-500">{food.meal_type}</span>
                  </div>
                ))}
                {recentFoods.length === 0 && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-[#319141]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FaUtensils className="text-[#319141] text-xl" />
                    </div>
                    <p className="text-gray-600 text-sm">No foods added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
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

      {/* Food Details Modal */}
      {selectedFood && (
        <FoodDetailsModal
          isOpen={!!selectedFood}
          onClose={() => setSelectedFood(null)}
          food={selectedFood}
        />
      )}
    </div>
  );
} 