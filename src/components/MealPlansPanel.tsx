'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaPlus, FaTrash, FaCalendarAlt, FaTimes, FaEdit, FaSave, FaChevronLeft, FaRandom, FaUtensils, FaExclamationTriangle, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { User } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

interface FavoriteFood {
  id: string;
  name: string;
  ingredients: string;
  meal_types: string[];
}

interface DayMeal {
  breakfast: FavoriteFood | null;
  lunch: FavoriteFood | null;
  dinner: FavoriteFood | null;
}

interface WeeklyPlan {
  [date: string]: DayMeal;
}

interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  start_date: string;
  end_date: string;
  plan: WeeklyPlan;
  no_repeat: boolean;
}

type SelectingMeal = {
  day: string;
  type: 'breakfast' | 'lunch' | 'dinner';
} | null;

interface MealPlansPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMealPlanAdded?: () => void;
  user: User | null;
}

export default function MealPlansPanel({ isOpen, onClose, onMealPlanAdded, user }: MealPlansPanelProps) {
  const { user: authUser } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [noRepeat, setNoRepeat] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] = useState<WeeklyPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectingMeal, setSelectingMeal] = useState<SelectingMeal>(null);
  const [selectedMealTypes, setSelectedMealTypes] = useState({
    breakfast: true,
    lunch: true,
    dinner: true
  });
  const panelRef = useRef<HTMLDivElement>(null);

  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Monday (Week 2)', 'Tuesday (Week 2)', 'Wednesday (Week 2)', 'Thursday (Week 2)', 'Friday (Week 2)', 'Saturday (Week 2)', 'Sunday (Week 2)'
  ];

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    
    const currentUser = user || authUser;
    if (!currentUser) {
      setError('Please log in to view your meal plans');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch meal plans
      const { data: mealPlansData, error: mealPlansError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (mealPlansError) throw mealPlansError;
      setMealPlans(mealPlansData || []);

      // Fetch favorite foods
      const { data: foodsData, error: foodsError } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', currentUser.id);

      if (foodsError) throw foodsError;
      setFavoriteFoods(foodsData || []);

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [isOpen, user, authUser, setMealPlans, setFavoriteFoods, setError, setLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getRandomFood = (foods: FavoriteFood[], mealType: 'breakfast' | 'lunch' | 'dinner'): FavoriteFood | null => {
    // Filter foods that have the specified meal type
    const availableFoods = foods.filter(food => 
      Array.isArray(food.meal_types) && food.meal_types.includes(mealType)
    );
    
    if (availableFoods.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableFoods.length);
    return availableFoods[randomIndex];
  };

  const generateMealPlan = () => {
    const [start, end] = dateRange;
    if (isGenerating || favoriteFoods.length === 0 || !start || !end) return;
    
    setIsGenerating(true);
    setCurrentMealPlan(null);
    setError(null);
    
    // Calculate number of days between start and end dates
    const daysToGenerate = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate total meals needed based on selected meal types
    const mealsPerDay = Object.values(selectedMealTypes).filter(Boolean).length;
    const totalMealsNeeded = daysToGenerate * mealsPerDay;
    
    // Check if we have enough foods when no-repeat is enabled
    if (noRepeat) {
      let hasEnoughFoods = true;
      if (selectedMealTypes.breakfast) {
        const breakfastFoods = favoriteFoods.filter(food => 
          Array.isArray(food.meal_types) && food.meal_types.includes('breakfast')
        ).length;
        if (breakfastFoods < daysToGenerate) hasEnoughFoods = false;
      }
      if (selectedMealTypes.lunch) {
        const lunchFoods = favoriteFoods.filter(food => 
          Array.isArray(food.meal_types) && food.meal_types.includes('lunch')
        ).length;
        if (lunchFoods < daysToGenerate) hasEnoughFoods = false;
      }
      if (selectedMealTypes.dinner) {
        const dinnerFoods = favoriteFoods.filter(food => 
          Array.isArray(food.meal_types) && food.meal_types.includes('dinner')
        ).length;
        if (dinnerFoods < daysToGenerate) hasEnoughFoods = false;
      }
      
      if (!hasEnoughFoods) {
        setError(`Not enough foods for a no-repeat plan. You need at least ${daysToGenerate} different foods for each selected meal type.`);
        setIsGenerating(false);
        return;
      }
    }

    // Check if at least one meal type is selected
    if (mealsPerDay === 0) {
      setError('Please select at least one meal type (breakfast, lunch, or dinner).');
      setIsGenerating(false);
      return;
    }
    
    // Generate a random meal plan
    const plan: WeeklyPlan = {};
    
    // If no-repeat is enabled, create copies of foods array for each meal type
    let availableBreakfastFoods = favoriteFoods.filter(food => 
      Array.isArray(food.meal_types) && food.meal_types.includes('breakfast')
    );
    let availableLunchFoods = favoriteFoods.filter(food => 
      Array.isArray(food.meal_types) && food.meal_types.includes('lunch')
    );
    let availableDinnerFoods = favoriteFoods.filter(food => 
      Array.isArray(food.meal_types) && food.meal_types.includes('dinner')
    );
    
    // Generate meals for each day in the date range
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const day = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      
      // Initialize meals for this day
      const dayMeals: DayMeal = {
        breakfast: null,
        lunch: null,
        dinner: null
      };
      
      // Generate meals only for selected types
      if (selectedMealTypes.breakfast) {
        if (noRepeat) {
          const randomIndex = Math.floor(Math.random() * availableBreakfastFoods.length);
          dayMeals.breakfast = availableBreakfastFoods[randomIndex];
          availableBreakfastFoods = availableBreakfastFoods.filter((_, i) => i !== randomIndex);
        } else {
          dayMeals.breakfast = getRandomFood(favoriteFoods, 'breakfast');
        }
      }
      
      if (selectedMealTypes.lunch) {
        if (noRepeat) {
          const randomIndex = Math.floor(Math.random() * availableLunchFoods.length);
          dayMeals.lunch = availableLunchFoods[randomIndex];
          availableLunchFoods = availableLunchFoods.filter((_, i) => i !== randomIndex);
        } else {
          dayMeals.lunch = getRandomFood(favoriteFoods, 'lunch');
        }
      }
      
      if (selectedMealTypes.dinner) {
        if (noRepeat) {
          const randomIndex = Math.floor(Math.random() * availableDinnerFoods.length);
          dayMeals.dinner = availableDinnerFoods[randomIndex];
          availableDinnerFoods = availableDinnerFoods.filter((_, i) => i !== randomIndex);
        } else {
          dayMeals.dinner = getRandomFood(favoriteFoods, 'dinner');
        }
      }
      
      plan[day] = dayMeals;
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCurrentMealPlan(plan);
    setIsGenerating(false);
  };

  const saveMealPlan = async () => {
    const [start, end] = dateRange;
    if (!currentMealPlan || !user || !newPlanName.trim() || !start || !end) {
      const missingFields = [];
      if (!currentMealPlan) missingFields.push('meal plan');
      if (!user) missingFields.push('user');
      if (!newPlanName.trim()) missingFields.push('plan name');
      if (!start || !end) missingFields.push('date range');
      
      const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMessage);
      setError(errorMessage);
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);

      // Create the meal plan object
      const mealPlanData = {
        user_id: user.id,
        name: newPlanName.trim(),
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        plan: currentMealPlan,
        no_repeat: noRepeat
      };

      console.log('Attempting to save meal plan with data:', JSON.stringify(mealPlanData, null, 2));

      // Insert the meal plan and return the inserted data
      const { data: insertedData, error: insertError } = await supabase
        .from('meal_plans')
        .insert(mealPlanData)
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase error saving meal plan:', insertError);
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // Check for specific error types
        if (insertError.code === '42501') {
          setError('Permission denied. Please check your database access rights.');
        } else if (insertError.code === '23505') {
          setError('A meal plan with this name already exists.');
        } else {
          setError(`Failed to save meal plan: ${insertError.message || 'Unknown error'}`);
        }
        return;
      }

      if (!insertedData) {
        console.error('No data returned after saving meal plan');
        setError('Failed to save meal plan: No data returned from server');
        return;
      }

      console.log('Meal plan saved successfully:', insertedData);
      
      // Reset form state
      setSuccess('Meal plan saved successfully!');
      setNewPlanName('');
      setIsCreatingPlan(false);
      setCurrentMealPlan(null);
      setNoRepeat(false);
      setDateRange([null, null]);
      
      // Notify parent component immediately
      if (onMealPlanAdded) {
        await onMealPlanAdded();
      }
      
      // Fetch fresh data
      await loadData();
    } catch (err: any) {
      console.error('Unexpected error saving meal plan:', err);
      console.error('Error stack:', err.stack);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMealPlan = async (planId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSelectedPlan(null);
      await loadData();
      setSuccess('Meal plan deleted successfully!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error deleting meal plan:', err);
      setError('Failed to delete meal plan. Please try again.');
    }
  };

  const filteredMealPlans = mealPlans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewMealPlan = (plan: MealPlan) => {
    setSelectedPlan(plan);
  };

  const handleRemoveMeal = async (date: string, slot: keyof DayMeal) => {
    if (!selectedPlan) return;
    
    const updatedPlan = { ...selectedPlan.plan };
    updatedPlan[date] = {
      ...updatedPlan[date],
      [slot]: null
    };

    try {
      await updateMealPlan(selectedPlan.id, updatedPlan);
      setSelectedPlan({
        ...selectedPlan,
        plan: updatedPlan
      });
    } catch (err) {
      console.error('Error removing meal:', err);
      setError('Failed to remove meal. Please try again.');
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedPlan) return;
    
    try {
      setIsSaving(true);
      await updateMealPlan(selectedPlan.id, selectedPlan.plan);
      setSuccess('Changes saved successfully!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSelectedPlan = () => {
    if (!selectedPlan) return null;

    const displayName = selectedPlan.name.replace(/\s*\(\d+\)$/, '');
    const dates = Object.keys(selectedPlan.plan).sort();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-[#2B5C40] hover:text-[#224931] flex items-center text-sm"
              >
                <FaChevronLeft className="mr-1" />
                Back to Meal Plans
              </button>
            </div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <div className="text-sm text-gray-600 mt-1">
              {new Date(selectedPlan.start_date).toLocaleDateString()} - {new Date(selectedPlan.end_date).toLocaleDateString()} • {selectedPlan.no_repeat ? 'No Repeats' : 'Repeats Allowed'}
            </div>
            <div className="text-sm text-gray-500">
              Created: {new Date(selectedPlan.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-4 py-2 bg-[#2B593F] text-white rounded-md hover:bg-[#1F4530] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FaSave className="text-sm" />
              Save Changes
            </button>
            <button
              onClick={() => exportMealPlan(selectedPlan)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
            >
              <FaRandom className="text-sm" />
              Export CSV
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this meal plan?')) {
                  deleteMealPlan(selectedPlan.id);
                }
              }}
              className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors flex items-center gap-2"
            >
              <FaTrash className="text-sm" />
              Delete
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {dates.map(date => (
            <div key={date} className="rounded-lg bg-white shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              </div>
              <div className="divide-y">
                {Object.entries(selectedPlan.plan[date]).map(([slot, meal]) => (
                  <div key={slot} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <span className="text-gray-600 font-medium capitalize">{slot}:</span>
                      <span className="ml-2">{meal?.name || 'No meal selected'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectingMeal({ day: date, type: slot as 'breakfast' | 'lunch' | 'dinner' })}
                        className="bg-[#2B5C40] hover:bg-[#224931] text-white px-3 py-1.5 rounded-md text-sm transition-colors duration-200 flex items-center gap-2 min-w-[120px] justify-center"
                      >
                        {meal ? (
                          <>
                            <FaRandom className="text-xs" />
                            Change Meal
                          </>
                        ) : (
                          <>
                            <FaPlus className="text-xs" />
                            Add Meal
                          </>
                        )}
                      </button>
                      {meal && (
                        <button
                          onClick={() => handleRemoveMeal(date, slot as keyof DayMeal)}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove meal"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const exportMealPlan = async (plan: MealPlan) => {
    const rows = [['Date', 'Breakfast', 'Lunch', 'Dinner']];
    
    Object.entries(plan.plan)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .forEach(([date, meals]) => {
        rows.push([
          new Date(date).toLocaleDateString(),
          meals.breakfast?.name || '',
          meals.lunch?.name || '',
          meals.dinner?.name || ''
        ]);
      });
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${plan.name.replace(/\s*\(\d+\)$/, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateMealPlan = async (planId: string, updatedPlan: WeeklyPlan) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('meal_plans')
        .update({ plan: updatedPlan })
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await loadData();
      setSuccess('Meal plan updated successfully!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error updating meal plan:', err);
      setError('Failed to update meal plan. Please try again.');
    }
  };

  const handleClose = useCallback(() => {
    // Reset form state
    setCurrentMealPlan(null);
    setNewPlanName('');
    setDateRange([null, null]);
    setError(null);
    setSuccess(null);
    
    // Trigger refresh before closing
    if (onMealPlanAdded) {
      onMealPlanAdded();
    }
    
    // Close the panel
    onClose();
  }, [onClose, onMealPlanAdded]);

  const handleError = (err: Error | { message: string } | unknown) => {
    const message = err instanceof Error ? err.message : 
      typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : 
      'An unexpected error occurred';
    setError(message);
  };

  const handleMealChange = async (date: string, mealType: keyof DayMeal, meal: FavoriteFood | null) => {
    if (!selectedPlan || !currentMealPlan) return;

    try {
      setIsSaving(true);
      setError(null);

      // Create a deep copy of the current meal plan
      const updatedPlan = JSON.parse(JSON.stringify(currentMealPlan)) as WeeklyPlan;

      // Initialize the date entry if it doesn't exist
      if (!updatedPlan[date]) {
        updatedPlan[date] = {
          breakfast: null,
          lunch: null,
          dinner: null
        };
      }

      // Update the specific meal
      updatedPlan[date][mealType] = meal;

      // Update in database
      const { error: updateError } = await supabase
        .from('meal_plans')
        .update({ plan: updatedPlan })
        .eq('id', selectedPlan.id);

      if (updateError) throw updateError;

      // Update local state
      setCurrentMealPlan(updatedPlan);
      toast.success('Meal updated successfully');

    } catch (err: any) {
      console.error('Error updating meal:', err);
      setError(`Failed to update meal: ${err.message}`);
      toast.error('Failed to update meal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-light shadow-xl">
                    <div className="px-6 pt-6 pb-4 border-b border-border">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-xl font-medium text-primary">
                          Meal Plans
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="text-text-secondary hover:text-primary"
                            onClick={handleClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <FaTimes className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      {/* Notification Messages */}
                      <AnimatePresence>
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex justify-between items-center"
                          >
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                              <FaTimes />
                            </button>
                          </motion.div>
                        )}
                        
                        {success && (
                          <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6 flex justify-between items-center"
                          >
                            <span>{success}</span>
                            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
                              <FaTimes />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {selectedPlan ? (
                        renderSelectedPlan()
                      ) : isCreatingPlan ? (
                        /* Create New Plan View */
                        <div>
                          <div className="mb-6">
                            <button
                              onClick={() => setIsCreatingPlan(false)}
                              className="text-[#2B5C40] hover:text-[#224931] flex items-center text-sm"
                            >
                              <FaChevronLeft className="mr-1" />
                              Back to Meal Plans
                            </button>
                          </div>

                          <div className="bg-light border border-border rounded-lg p-5 mb-6">
                            <h3 className="font-medium text-primary mb-4">Create New Meal Plan</h3>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="planName">
                                Plan Name
                              </label>
                              <input
                                id="planName"
                                type="text"
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5C40] focus:border-transparent"
                                value={newPlanName}
                                onChange={(e) => setNewPlanName(e.target.value)}
                                placeholder="e.g., Weekly Family Meals"
                                required
                              />
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-text-secondary mb-2">
                                Date Range
                              </label>
                              <div className="relative">
                                <DatePicker
                                  selectsRange={true}
                                  startDate={dateRange[0]}
                                  endDate={dateRange[1]}
                                  onChange={(update: [Date | null, Date | null]) => {
                                    setDateRange(update);
                                  }}
                                  isClearable={false}
                                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5C40] focus:border-transparent"
                                  dateFormat="MMM d, yyyy"
                                  minDate={new Date()}
                                  placeholderText="Select date range"
                                />
                                <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary pointer-events-none" />
                              </div>
                              {dateRange[0] && dateRange[1] && (
                                <p className="mt-2 text-xs text-text-secondary">
                                  Duration: {Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                                </p>
                              )}
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-text-secondary mb-2">
                                Meal Types to Include
                              </label>
                              <div className="space-y-2">
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox text-[#2B5C40]"
                                    checked={selectedMealTypes.breakfast}
                                    onChange={(e) => setSelectedMealTypes(prev => ({
                                      ...prev,
                                      breakfast: e.target.checked
                                    }))}
                                  />
                                  <span className="ml-2">Breakfast</span>
                                </label>
                                <div className="flex items-center space-x-4">
                                  <label className="inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      className="form-checkbox text-[#2B5C40]"
                                      checked={selectedMealTypes.lunch}
                                      onChange={(e) => setSelectedMealTypes(prev => ({
                                        ...prev,
                                        lunch: e.target.checked
                                      }))}
                                    />
                                    <span className="ml-2">Lunch</span>
                                  </label>
                                  <label className="inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      className="form-checkbox text-[#2B5C40]"
                                      checked={selectedMealTypes.dinner}
                                      onChange={(e) => setSelectedMealTypes(prev => ({
                                        ...prev,
                                        dinner: e.target.checked
                                      }))}
                                    />
                                    <span className="ml-2">Dinner</span>
                                  </label>
                                </div>
                              </div>
                              {Object.values(selectedMealTypes).filter(Boolean).length === 0 && (
                                <div className="mt-2 text-xs text-red-600 flex items-start">
                                  <FaExclamationTriangle className="mr-1 mt-0.5 flex-shrink-0" />
                                  <span>Please select at least one meal type</span>
                                </div>
                              )}
                            </div>

                            <div className="mb-4">
                              <label className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  className="form-checkbox text-[#2B5C40]"
                                  checked={noRepeat}
                                  onChange={() => setNoRepeat(!noRepeat)}
                                />
                                <span className="ml-2">No Repeat Meals</span>
                              </label>
                              {noRepeat && dateRange[0] && dateRange[1] && (
                                <div className="mt-2 text-xs text-amber-600 flex items-start">
                                  <FaExclamationTriangle className="mr-1 mt-0.5 flex-shrink-0" />
                                  <span>
                                    This requires {Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24) + 1) * 
                                      Object.values(selectedMealTypes).filter(Boolean).length} different foods 
                                    (you have {favoriteFoods.length})
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={generateMealPlan}
                              disabled={isGenerating || favoriteFoods.length === 0 || Object.values(selectedMealTypes).filter(Boolean).length === 0}
                              className="w-full bg-[#319141] hover:bg-[#224931] text-white px-4 py-2 rounded-md flex items-center justify-center mb-4 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              {isGenerating ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FaRandom className="mr-2" />
                                  Generate Random Plan
                                </>
                              )}
                            </button>
                            
                            {favoriteFoods.length === 0 && (
                              <div className="text-sm text-red-500 mb-4 flex items-center">
                                <FaExclamationTriangle className="mr-1" />
                                You need to add some favorite foods before generating a meal plan.
                              </div>
                            )}
                          </div>

                          {currentMealPlan && (
                            <div>
                              <h3 className="font-medium text-primary mb-4">Generated Meal Plan</h3>
                              
                              <div className="space-y-4 mb-6">
                                {Object.entries(currentMealPlan)
                                  .slice(0, Math.ceil((dateRange[1]?.getTime() ?? 0 - (dateRange[0]?.getTime() ?? 0)) / (1000 * 60 * 60 * 24)) + 1)
                                  .map(([day, meals]) => (
                                    <div key={day} className="border border-border rounded-lg overflow-hidden">
                                      <div className="bg-gray-50 px-4 py-2 border-b border-border">
                                        <h4 className="font-medium text-primary">{day}</h4>
                                      </div>
                                      <div className="p-3 space-y-3">
                                        {selectedMealTypes.breakfast && (
                                          <div className="flex items-center">
                                            <div className="w-20 text-xs font-medium text-text-secondary">Breakfast:</div>
                                            <div className="flex-1 text-sm text-primary">
                                              {meals.breakfast?.name || (
                                                <span className="text-amber-600 text-xs">
                                                  No breakfast options available. Add some breakfast meals in "My Meals" to see options here.
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => handleMealChange(day, 'breakfast', meals.breakfast!)}
                                                className="text-[#2B5C40] hover:text-[#224931]"
                                                title="Random breakfast"
                                              >
                                                <FaRandom className="text-sm" />
                                              </button>
                                              <button
                                                onClick={() => setSelectingMeal({ day, type: 'breakfast' })}
                                                className="bg-[#2B5C40] hover:bg-[#224931] text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                                              >
                                                Select
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {selectedMealTypes.lunch && (
                                          <div className="flex items-center">
                                            <div className="w-20 text-xs font-medium text-text-secondary">Lunch:</div>
                                            <div className="flex-1 text-sm text-primary">
                                              {meals.lunch?.name || (
                                                <span className="text-amber-600 text-xs">
                                                  No lunch options available. Add some lunch meals in "My Meals" to see options here.
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => handleMealChange(day, 'lunch', meals.lunch!)}
                                                className="text-[#2B5C40] hover:text-[#224931]"
                                                title="Random lunch"
                                              >
                                                <FaRandom className="text-sm" />
                                              </button>
                                              <button
                                                onClick={() => setSelectingMeal({ day, type: 'lunch' })}
                                                className="bg-[#2B5C40] hover:bg-[#224931] text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                                              >
                                                Select
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {selectedMealTypes.dinner && (
                                          <div className="flex items-center">
                                            <div className="w-20 text-xs font-medium text-text-secondary">Dinner:</div>
                                            <div className="flex-1 text-sm text-primary">
                                              {meals.dinner?.name || (
                                                <span className="text-amber-600 text-xs">
                                                  No dinner options available. Add some dinner meals in "My Meals" to see options here.
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => handleMealChange(day, 'dinner', meals.dinner!)}
                                                className="text-[#2B5C40] hover:text-[#224931]"
                                                title="Random dinner"
                                              >
                                                <FaRandom className="text-sm" />
                                              </button>
                                              <button
                                                onClick={() => setSelectingMeal({ day, type: 'dinner' })}
                                                className="bg-[#2B5C40] hover:bg-[#224931] text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                                              >
                                                Select
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                ))}
                              </div>
                              
                              <div className="flex space-x-3">
                                <button
                                  onClick={generateMealPlan}
                                  className="flex-1 border border-[#2B5C40] text-[#2B5C40] hover:bg-[#2B5C40] hover:text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors duration-200"
                                  disabled={isGenerating}
                                >
                                  {isGenerating ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-[#2B5C40] border-t-transparent rounded-full animate-spin mr-2"></div>
                                      Regenerating...
                                    </>
                                  ) : (
                                    <>
                                      <FaRandom className="mr-2" />
                                      Regenerate
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={saveMealPlan}
                                  disabled={isSaving || !newPlanName.trim()}
                                  className="flex-1 bg-[#2B5C40] hover:bg-[#224931] text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                  {isSaving ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <FaSave className="mr-2" />
                                      Save Plan
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    if (currentMealPlan && user) {
                                      exportMealPlan({
                                        id: 'temp',
                                        user_id: user.id,
                                        name: newPlanName,
                                        created_at: new Date().toISOString(),
                                        start_date: dateRange[0]?.toISOString() || '',
                                        end_date: dateRange[1]?.toISOString() || '',
                                        plan: currentMealPlan,
                                        no_repeat: noRepeat
                                      });
                                    }
                                  }}
                                  disabled={!currentMealPlan || !user}
                                  className="flex-1 border border-[#2B5C40] text-[#2B5C40] hover:bg-[#2B5C40] hover:text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                  <FaRandom className="mr-2" />
                                  Export CSV
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Meal Plans List View */
                        <>
                          {/* Create Plan Button */}
                          <button
                            onClick={() => setIsCreatingPlan(true)}
                            className="w-full bg-[#319141] hover:bg-[#224931] text-white px-4 py-3 rounded-md flex items-center justify-center mb-6 transition-colors duration-200"
                          >
                            <FaPlus className="mr-2" />
                            Create New Meal Plan
                          </button>

                          {/* Search Bar */}
                          <div className="mb-6">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search meal plans..."
                                className="w-full px-4 py-3 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5C40] focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Meal Plans List */}
                          {loading ? (
                            <div className="flex justify-center items-center h-64">
                              <div className="w-12 h-12 border-4 border-[#2B5C40] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : filteredMealPlans.length === 0 ? (
                            <div className="bg-light border border-border rounded-lg p-8 text-center">
                              <div className="w-16 h-16 bg-[#2B5C40] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCalendarAlt className="text-[#2B5C40] text-xl" />
                              </div>
                              <h3 className="text-xl font-medium text-primary mb-2">No meal plans found</h3>
                              <p className="text-text-secondary mb-6">
                                {searchTerm ? "No meal plans match your search criteria." : "You haven't created any meal plans yet."}
                              </p>
                              <button
                                onClick={() => setIsCreatingPlan(true)}
                                className="bg-[#2B5C40] hover:bg-[#224931] text-white px-6 py-2 rounded-md inline-flex items-center transition-colors duration-200"
                              >
                                <FaPlus className="mr-2" />
                                Create Your First Meal Plan
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {filteredMealPlans.map((plan) => (
                                <motion.div
                                  key={plan.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="bg-white border border-border rounded-lg overflow-hidden shadow-sm"
                                >
                                  <div className="p-5">
                                    <h3 className="font-medium text-lg text-primary mb-2">{plan.name}</h3>
                                    <div className="flex items-center text-sm text-text-secondary mb-4">
                                      <FaCalendarAlt className="mr-2" />
                                      <span>
                                        {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                                      </span>
                                      {plan.no_repeat && (
                                        <>
                                          <span className="mx-2">•</span>
                                          <span>No Repeats</span>
                                        </>
                                      )}
                                      <span className="mx-2">•</span>
                                      <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => viewMealPlan(plan)}
                                        className="bg-[#319141] hover:bg-[#224931] text-white px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                                      >
                                        <FaEdit className="mr-1" />
                                        View Details
                                      </button>
                                      <button
                                        onClick={() => exportMealPlan(plan)}
                                        className="border border-[#319141] text-[#2B5C40] hover:bg-[#319141] hover:text-white px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                                      >
                                        <FaRandom className="mr-1" />
                                        Export CSV
                                      </button>
                                      <button
                                        onClick={() => deleteMealPlan(plan.id)}
                                        className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                                      >
                                        <FaTrash className="mr-1" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>

        {/* Food Selection Modal */}
        {selectingMeal && (
          <Dialog
            open={!!selectingMeal}
            onClose={() => setSelectingMeal(null)}
            className="fixed inset-0 z-[60] overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <Dialog.Overlay 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
              />

              <div className="relative inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl border border-gray-100">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setSelectingMeal(null)}
                  >
                    <span className="sr-only">Close</span>
                    <FaTimes className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-[#2B5C40]">
                    {selectingMeal.type === 'breakfast' ? 'Select Breakfast' :
                     selectingMeal.type === 'lunch' ? 'Select Lunch' :
                     'Select Dinner'} for {new Date(selectingMeal.day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose from your favorite meals or search for a specific one.
                  </p>
                </div>

                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search meals..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5C40]/20 focus:border-[#2B5C40] transition-colors"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
                  <div className="space-y-1">
                    {favoriteFoods
                      .filter(food => 
                        food.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(food => (
                        <button
                          key={food.id}
                          onClick={() => {
                            handleMealChange(selectingMeal.day, selectingMeal.type, food);
                            setSelectingMeal(null);
                          }}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#2B5C40]/5 focus:bg-[#2B5C40]/10 transition-colors duration-150 group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900 group-hover:text-[#2B5C40]">
                                {food.name}
                              </span>
                              {Array.isArray(food.meal_types) && food.meal_types.length > 0 && (
                                <div className="mt-1 flex gap-2">
                                  {food.meal_types.map(type => (
                                    <span
                                      key={type}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#2B5C40]/10 text-[#2B5C40]"
                                    >
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <FaChevronRight className="h-4 w-4 text-[#2B5C40]" aria-hidden="true" />
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>

                  {favoriteFoods.length === 0 && (
                    <div className="text-center py-8">
                      <div className="mx-auto h-12 w-12 text-[#2B5C40]">
                        <FaUtensils className="h-12 w-12 opacity-20" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No meals available</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding some meals to your favorites.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            setSelectingMeal(null);
                            // Add navigation to My Foods section here if needed
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2B5C40] hover:bg-[#224931] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B5C40]"
                        >
                          <FaPlus className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                          Add New Meal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Dialog>
        )}
      </Dialog>
    </Transition>
  );
} 