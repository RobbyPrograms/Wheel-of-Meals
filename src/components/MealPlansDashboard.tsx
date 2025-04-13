'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import MealPlansSlideover from './MealPlansSlideover';
import MealPlanForm from './MealPlanForm';
import MealPlanEditor from './MealPlanEditor';
import { MealPlan, DayMeal, WeeklyPlan } from '@/lib/types';

interface MealPlansDashboardProps {
  mealPlans: MealPlan[];
  onMealPlanChange?: (mealPlan: MealPlan) => void;
  onMealPlanDelete?: (mealPlan: MealPlan) => void;
}

export default function MealPlansDashboard() {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchMealPlans = useCallback(async () => {
    if (!user) {
      setMealPlans([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching meal plans:', error);
        setError('Failed to load meal plans');
        return;
      }

      // Parse plan data if needed
      const parsedPlans = data.map(plan => ({
        ...plan,
        plan: typeof plan.plan === 'string' ? JSON.parse(plan.plan) : plan.plan
      }));

      setMealPlans(parsedPlans);
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      setError('Failed to load meal plans');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch when user is available
  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  // Handle URL params for panel state
  useEffect(() => {
    const shouldOpenPanel = searchParams.has('meal-plans');
    setIsPanelOpen(shouldOpenPanel);
  }, [searchParams]);

  const handleViewDetails = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setMode('edit');
    setIsPanelOpen(true);
  };

  const handlePanelClose = useCallback(() => {
    // Remove the meal-plans parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete('meal-plans');
    router.replace(url.pathname + url.search);

    // Close the panel and reset state
    setIsPanelOpen(false);
    setSelectedPlan(null);
    setMode('create');

    // Refresh the page data and fetch fresh data
    router.refresh();
    fetchMealPlans();
  }, [fetchMealPlans, router]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Recent Meal Plans</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </>
        ) : mealPlans.length === 0 ? (
          <div className="col-span-3 text-center py-8">
            <p className="text-gray-500">No meal plans yet. Create your first one!</p>
          </div>
        ) : (
          mealPlans.map((plan) => {
            // Extract the display name by removing the timestamp
            const displayName = plan.name.replace(/\s*\(\d+\)$/, '');
            
            return (
              <div
                key={plan.id}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">{displayName}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleViewDetails(plan)}
                    className="text-sm text-primary hover:text-primary-dark transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MealPlansSlideover
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        onMealPlanAdded={fetchMealPlans}
        mode={mode}
        mealPlan={selectedPlan}
      >
        {mode === 'create' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Create New Meal Plan</h2>
            <MealPlanForm onSuccess={handlePanelClose} />
          </div>
        ) : (
          <MealPlanEditor
            mealPlan={selectedPlan!}
            onClose={handlePanelClose}
          />
        )}
      </MealPlansSlideover>
    </div>
  );
} 