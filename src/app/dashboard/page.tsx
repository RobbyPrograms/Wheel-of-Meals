'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import { FaUtensils, FaCalendarAlt, FaRandom, FaChevronRight } from 'react-icons/fa';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const [foodCount, setFoodCount] = useState<number | null>(null);
  const [mealPlanCount, setMealPlanCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentFoods, setRecentFoods] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get food count
        const { count: foodCountResult, error: foodError } = await supabase
          .from('favorite_foods')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (foodError) throw foodError;
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
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-primary">
          Welcome to your dashboard
        </h1>
        <div className="bg-accent bg-opacity-10 text-accent text-xs px-3 py-1">Level 1 Chef</div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link href="/dashboard/foods" className="border border-border hover:shadow-medium transition-all duration-300">
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
        </Link>

        <Link href="/dashboard/meal-plans" className="border border-border hover:shadow-medium transition-all duration-300">
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
        </Link>

        <Link href="/dashboard/random" className="border border-border hover:shadow-medium transition-all duration-300">
          <div className="p-6">
            <div className="bg-accent text-light w-12 h-12 flex items-center justify-center rounded-full mb-4">
              <FaRandom className="text-xl" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-primary">Random Meal</h3>
            <p className="text-text-secondary text-sm mb-4">Get a random meal suggestion</p>
            <div className="flex items-center text-accent text-sm font-medium">
              <span>View Details</span>
              <FaChevronRight className="ml-2 text-xs" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Overview */}
        <div className="lg:col-span-2">
          <div className="border border-border p-6">
            <h2 className="text-lg font-medium mb-6 text-primary">Activity Overview</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
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
                  
                  <div className="border border-border p-4">
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
        </div>
        
        {/* Recent Foods */}
        <div className="lg:col-span-1">
          <div className="border border-border p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-primary">Recent Foods</h2>
              <Link href="/dashboard/foods" className="text-accent hover:text-highlight text-sm flex items-center">
                View All <FaChevronRight className="ml-1 text-xs" />
              </Link>
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
                <Link 
                  href="/dashboard/foods" 
                  className="bg-accent text-light px-4 py-2 inline-block hover:bg-highlight transition-colors"
                >
                  Add Your First Food
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 