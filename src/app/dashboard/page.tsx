'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FaUtensils, FaCalendarAlt, FaRandom, FaChevronRight, FaLightbulb, FaUserFriends, FaCompass, FaTrophy, FaStar, FaDice, FaRobot, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { autoSetupDatabase } from '@/lib/auto-setup';
import FoodsPanel from '@/components/FoodsPanel';
import MealPlansPanel from '@/components/MealPlansPanel';
import MealPlansDashboard from '@/components/MealPlansDashboard';
import { AISuggestions } from '@/components/AISuggestions';
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
  const { user, loading } = useAuth();
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
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check for email confirmation success
  useEffect(() => {
    const emailConfirmed = searchParams.get('emailConfirmed');
    if (emailConfirmed === 'true') {
      setShowEmailConfirmed(true);
      // Clear the parameter after a delay
      setTimeout(() => {
        setShowEmailConfirmed(false);
        window.history.replaceState({}, '', '/dashboard');
      }, 5000);
    }
  }, [searchParams]);

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
    recipe: string[] | string;
    visibility: 'public' | 'private';
  }) => {
    if (!user) return;

    try {
      // Process ingredients from the description
      let ingredients: string[] = [];
      
      // Check if the description looks like a single description rather than comma-separated ingredients
      if (meal.description && meal.description.length > 0) {
        if (meal.description.includes(',')) {
          // If it has commas, split by commas and use as ingredients
          ingredients = meal.description.split(',').map(i => i.trim()).filter(Boolean);
        } else {
          // If it's a single description without commas, just use it as one ingredient
          // unless it's clearly a description (too long)
          if (meal.description.length < 100) {
            ingredients = [meal.description.trim()];
          } else {
            // For long descriptions, extract likely ingredients using common cooking terms
            const possibleIngredients = meal.description.match(/\b(beef|chicken|pork|fish|pasta|rice|potatoes|onion|garlic|tomato|cheese|butter|oil|salt|pepper|sugar|flour|eggs|milk)\b/gi);
            if (possibleIngredients && possibleIngredients.length > 0) {
              ingredients = Array.from(new Set(possibleIngredients)); // Remove duplicates
            } else {
              // If all else fails, use a placeholder
              ingredients = ["Ingredients not specified"];
            }
          }
        }
      }
      
      // Ensure we have some ingredients
      if (ingredients.length === 0) {
        ingredients = ["Ingredients not specified"];
      }
      
      // Format recipe instructions
      let instructions: string[] = [];
      
      // Handle different instruction formats
      if (meal.recipe) {
        // Case 1: Already an array
        if (Array.isArray(meal.recipe)) {
          instructions = meal.recipe
            .filter(step => typeof step === 'string' && step.trim().length > 0)
            .map(step => {
              // Clean up the step
              let cleaned = step.trim();
              
              // Remove quotes if present
              if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.substring(1, cleaned.length - 1);
              }
              
              // Remove brackets if present
              cleaned = cleaned.replace(/^\[|\]$/g, '');
              
              return cleaned;
            });
        }
        // Case 2: JSON string array
        else if (typeof meal.recipe === 'string' && 
                meal.recipe.trim().startsWith('[') && 
                meal.recipe.trim().endsWith(']')) {
          try {
            const parsed = JSON.parse(meal.recipe);
            if (Array.isArray(parsed)) {
              instructions = parsed
                .filter(step => typeof step === 'string' && step.trim().length > 0)
                .map(step => step.trim().replace(/^"|"$/g, '').replace(/^\[|\]$/g, ''));
            } else {
              instructions = [meal.recipe.replace(/^\[|\]$/g, '')];
            }
          } catch (e) {
            console.error('Failed to parse recipe JSON:', e);
            // Fall back to treating as a string
            instructions = [meal.recipe.replace(/^\[|\]$/g, '')];
          }
        }
        // Case 3: Regular string - split by newlines or periods
        else if (typeof meal.recipe === 'string') {
          instructions = meal.recipe
            .split(/(?:\r?\n|\.(?=\s|$))/) // Split by newlines or periods followed by space or end of string
            .map(step => step.trim())
            .filter(step => step.length > 3);
        }
      }
      
      // Ensure we have some instructions
      if (instructions.length === 0) {
        instructions = ["No detailed instructions provided."];
      }
      
      // Final cleanup to ensure no quotes or brackets remain
      instructions = instructions.map(step => {
        let cleaned = step;
        // Remove quotes if present
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        // Remove brackets
        cleaned = cleaned.replace(/^\[|\]$/g, '');
        // Remove backslashes
        cleaned = cleaned.replace(/\\/g, '');
        return cleaned;
      });
      
      // Debug output to see what we're storing
      console.log('Storing instructions:', instructions);
      
      // Store directly as an array - DO NOT STRINGIFY
      const { error } = await supabase
        .from('favorite_foods')
        .insert({
          user_id: user.id,
          name: meal.name,
          ingredients: ingredients,
          recipe: instructions, // Store as a proper array
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

  // Add meal from AI suggestions
  const handleAddMealFromAI = (meal: {
    name: string;
    description: string;
    ingredients: string[];
    recipe: string[];
    visibility: 'public' | 'private';
  }) => {
    // Ensure ingredients are properly formatted and not descriptions
    let cleanedIngredients: string[] = [];
    
    if (meal.ingredients && meal.ingredients.length > 0) {
      // Filter out any "hearty" or descriptive-only ingredients
      cleanedIngredients = meal.ingredients.filter(ing => {
        // Skip ingredients that are just adjectives or too short
        if (ing.length < 3) return false;
        
        // Skip ingredients that are just descriptive terms
        const descriptiveTerms = ['hearty', 'delicious', 'tasty', 'flavorful', 'savory', 'sweet', 'sour', 'spicy'];
        if (descriptiveTerms.includes(ing.toLowerCase())) return false;
        
        // Include ingredients that have specific food items or measurements
        const hasSpecificFood = /\b(beef|chicken|pork|fish|pasta|rice|potato|onion|garlic|tomato|cheese|butter|oil|salt|pepper|sugar|flour|egg|milk)\b/i.test(ing);
        const hasMeasurement = /\b(\d+|cup|tbsp|tsp|oz|lb|g|kg|ml|l)\b/i.test(ing);
        
        // Keep ingredients that are reasonably sized and aren't just descriptions
        return hasSpecificFood || hasMeasurement || (ing.length > 3 && ing.length < 40);
      });
    }
    
    // If we end up with no ingredients, extract from description
    if (cleanedIngredients.length === 0 && meal.description) {
      // Try to extract ingredients from the description
      const foodTerms = meal.description.match(/\b(beef|chicken|pork|fish|pasta|rice|potato|onion|garlic|tomato|cheese|butter|oil|salt|pepper|sugar|flour|egg|milk)\b/gi);
      if (foodTerms && foodTerms.length > 0) {
        cleanedIngredients = Array.from(new Set(foodTerms));
      }
    }
    
    // Ensure we have at least some ingredient
    if (cleanedIngredients.length === 0) {
      cleanedIngredients = ["Main ingredients not specified"];
    }
    
    // Clean up recipe instructions
    let cleanedInstructions: string[] = [];
    
    if (meal.recipe && meal.recipe.length > 0) {
      // Special debugging to see the exact recipe format we're getting
      console.log('AI recipe raw format:', typeof meal.recipe);
      console.log('AI recipe raw value:', JSON.stringify(meal.recipe));
      console.log('AI recipe is array:', Array.isArray(meal.recipe));
      
      // Deep clean each instruction step
      cleanedInstructions = meal.recipe
        .filter(step => {
          // Skip very short steps
          if (!step || step.length < 5) return false;
          
          // Skip steps that are just a single letter
          if (/^[a-zA-Z]$/.test(step.trim())) return false;
          
          return true;
        })
        .map(step => {
          // Clean up the step text
          let cleaned = step.trim();
          
          // Remove surrounding quotes
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
          }
          
          // Remove surrounding brackets
          cleaned = cleaned.replace(/^\[|\]$/g, '');
          
          // Remove number prefixes (like "1. " or "Step 1:")
          cleaned = cleaned.replace(/^(\d+\.|\d+\)|\d+\s*-|Step\s*\d+:?)\s*/, '');
          
          return cleaned;
        });
      
      // Log for debugging but as plain array, not stringified
      console.log('AI suggested instructions (cleaned):', cleanedInstructions);
    }
    
    // IMPORTANT: If we somehow get a string array as a string (like "[\"step1\",\"step2\"]"), parse it properly
    if (cleanedInstructions.length === 1 && 
        typeof cleanedInstructions[0] === 'string' && 
        cleanedInstructions[0].startsWith('[') && 
        cleanedInstructions[0].endsWith(']')) {
      try {
        // Attempt to parse it as a JSON string
        const parsedInstructions = JSON.parse(cleanedInstructions[0]);
        if (Array.isArray(parsedInstructions)) {
          // If we successfully parsed it as an array, use the parsed value
          cleanedInstructions = parsedInstructions.map(step => {
            let cleaned = typeof step === 'string' ? step.trim() : '';
            // Remove quotes if present
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.substring(1, cleaned.length - 1);
            }
            // Remove brackets
            cleaned = cleaned.replace(/^\[|\]$/g, '');
            return cleaned;
          }).filter(Boolean);
          
          console.log('Parsed nested instruction array:', cleanedInstructions);
        }
      } catch (e) {
        console.error('Error parsing instruction string:', e);
        // Keep the original if parsing fails
      }
    }
    
    handleAddToFavorites({
      name: meal.name,
      description: cleanedIngredients.join(', '),
      recipe: cleanedInstructions,
      visibility: meal.visibility
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Email confirmation success message */}
          {showEmailConfirmed && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-fade-in">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm leading-5 font-medium text-green-800">
                    Email confirmed successfully! Your account is now fully activated.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="lg:col-span-2">
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
                    {/* My Meals Card */}
                    <Link 
                      href="/dashboard/foods"
                      className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-300 hover:bg-[#319141]/5 w-full"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#319141]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <FaUtensils className="text-[#319141] text-xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#0F1E0F]">My Meals</h3>
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
                          <h2 className="text-lg font-semibold text-[#0F1E0F]">Recent Meals</h2>
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
                user={user}
              />

              {/* AI Suggestions Modal */}
              {isAIPanelOpen && (
                <div className="fixed inset-0 bg-gray-800/75 z-50 flex items-start justify-center">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-2 my-2 flex flex-col max-h-[98vh] h-[98vh] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                      <h2 className="text-xl font-semibold text-[#0F1E0F] flex items-center">
                        <FaRobot className="mr-2 text-[#319141]" />
                        Chat with AI Chef
                      </h2>
                      <button
                        onClick={() => setIsAIPanelOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                        aria-label="Close AI suggestions panel"
                      >
                        <FaTimes className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <AISuggestions onAddMeal={handleAddMealFromAI} />
                    </div>
                  </div>
                </div>
              )}

              {/* Food Details Modal */}
              {selectedFood && (
                <FoodDetailsModal
                  isOpen={!!selectedFood}
                  onClose={() => setSelectedFood(null)}
                  food={{
                    name: selectedFood.name || '',
                    meal_type: selectedFood.meal_type || '',
                    ingredients: Array.isArray(selectedFood.ingredients) ? selectedFood.ingredients : [],
                    instructions: selectedFood.recipe ? 
                      (typeof selectedFood.recipe === 'string' ? 
                        (selectedFood.recipe.startsWith('[') && selectedFood.recipe.endsWith(']') ? 
                          (() => {
                            try {
                              return JSON.parse(selectedFood.recipe);
                            } catch (e) {
                              return selectedFood.recipe.split(/[\n.]+/).filter(Boolean);
                            }
                          })() 
                          : selectedFood.recipe.split(/[\n.]+/).filter(Boolean)
                        )
                        : selectedFood.recipe
                      ) : [],
                    prep_time: selectedFood.prep_time,
                    servings: selectedFood.servings
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 