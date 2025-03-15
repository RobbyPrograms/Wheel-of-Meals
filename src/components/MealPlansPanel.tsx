'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaPlus, FaTrash, FaCalendarAlt, FaTimes, FaEdit, FaSave, FaChevronLeft, FaRandom, FaUtensils, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

type FavoriteFood = {
  id: string;
  name: string;
  ingredients: string;
};

type DayMeal = {
  breakfast: FavoriteFood | null;
  lunch: FavoriteFood | null;
  dinner: FavoriteFood | null;
};

type WeeklyPlan = {
  [key: string]: DayMeal;
};

type MealPlan = {
  id: string;
  name: string;
  created_at: string;
  duration: 'one_week' | 'two_weeks';
  plan: WeeklyPlan;
  no_repeat: boolean;
};

interface MealPlansPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMealPlanAdded?: () => void;
}

export default function MealPlansPanel({ isOpen, onClose, onMealPlanAdded }: MealPlansPanelProps) {
  const { user } = useAuth();
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
  const [duration, setDuration] = useState<'one_week' | 'two_weeks'>('one_week');
  const [noRepeat, setNoRepeat] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] = useState<WeeklyPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Monday (Week 2)', 'Tuesday (Week 2)', 'Wednesday (Week 2)', 'Thursday (Week 2)', 'Friday (Week 2)', 'Saturday (Week 2)', 'Sunday (Week 2)'
  ];

  useEffect(() => {
    if (isOpen && user) {
      fetchMealPlans();
      fetchFavoriteFoods();
    }
  }, [isOpen, user]);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setError('You must be logged in to view your meal plans');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching meal plans:', error);
        setError(`Failed to load meal plans: ${error.message}`);
        return;
      }

      setMealPlans(data || []);
    } catch (err: any) {
      console.error('Unexpected error fetching meal plans:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteFoods = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorite foods:', error);
        return;
      }

      setFavoriteFoods(data || []);
    } catch (err: any) {
      console.error('Unexpected error fetching favorite foods:', err);
    }
  };

  const generateMealPlan = () => {
    if (isGenerating || favoriteFoods.length === 0) return;
    
    setIsGenerating(true);
    setCurrentMealPlan(null);
    setError(null);
    
    // Determine how many days to generate
    const daysToGenerate = duration === 'one_week' ? 7 : 14;
    
    // Calculate total meals needed
    const totalMealsNeeded = daysToGenerate * 3; // 3 meals per day
    
    // Check if we have enough foods when no-repeat is enabled
    if (noRepeat && favoriteFoods.length < totalMealsNeeded) {
      setError(`Not enough foods for a no-repeat plan. You need at least ${totalMealsNeeded} different foods, but you only have ${favoriteFoods.length}.`);
      setIsGenerating(false);
      return;
    }
    
    // Generate a random meal plan
    const plan: WeeklyPlan = {};
    
    // If no-repeat is enabled, create a copy of foods array to remove items as they're used
    let availableFoods = [...favoriteFoods];
    
    for (let i = 0; i < daysToGenerate; i++) {
      const day = days[i];
      
      // Randomly select meals for each time of day
      const breakfast = getRandomFood(availableFoods);
      if (noRepeat && breakfast) {
        availableFoods = availableFoods.filter(food => food.id !== breakfast.id);
      }
      
      const lunch = getRandomFood(availableFoods);
      if (noRepeat && lunch) {
        availableFoods = availableFoods.filter(food => food.id !== lunch.id);
      }
      
      const dinner = getRandomFood(availableFoods);
      if (noRepeat && dinner) {
        availableFoods = availableFoods.filter(food => food.id !== dinner.id);
      }
      
      plan[day] = { breakfast, lunch, dinner };
    }
    
    setCurrentMealPlan(plan);
    setIsGenerating(false);
  };
  
  const getRandomFood = (foods: FavoriteFood[]): FavoriteFood | null => {
    if (foods.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * foods.length);
    return foods[randomIndex];
  };

  const saveMealPlan = async () => {
    if (!currentMealPlan || !user || !newPlanName.trim()) {
      setError('Please provide a name for your meal plan');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          name: newPlanName.trim(),
          duration: duration,
          plan: currentMealPlan,
          no_repeat: noRepeat
        })
        .select();

      if (error) {
        console.error('Error saving meal plan:', error);
        setError(`Failed to save meal plan: ${error.message}`);
        return;
      }

      setSuccess('Meal plan saved successfully!');
      setNewPlanName('');
      setIsCreatingPlan(false);
      setCurrentMealPlan(null);
      setNoRepeat(false);
      await fetchMealPlans();
      if (onMealPlanAdded) onMealPlanAdded();
    } catch (err: any) {
      console.error('Unexpected error saving meal plan:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMealPlan = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting meal plan:', error);
        setError(`Failed to delete meal plan: ${error.message}`);
        return;
      }

      setSuccess('Meal plan deleted successfully!');
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
      await fetchMealPlans();
      if (onMealPlanAdded) onMealPlanAdded();
    } catch (err: any) {
      console.error('Unexpected error deleting meal plan:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredMealPlans = mealPlans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewMealPlan = (plan: MealPlan) => {
    setSelectedPlan(plan);
  };

  const closeSelectedPlan = () => {
    setSelectedPlan(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
          
          <motion.div
            ref={panelRef}
            className="absolute inset-y-0 right-0 max-w-full flex"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="relative w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-primary">
                      {selectedPlan ? selectedPlan.name : 'Meal Plans'}
                    </h2>
                    <button 
                      onClick={selectedPlan ? closeSelectedPlan : onClose}
                      className="text-text-secondary hover:text-primary transition-colors"
                    >
                      {selectedPlan ? <FaChevronLeft className="text-lg" /> : <FaTimes className="text-lg" />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6">
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
                    /* Meal Plan Detail View */
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-text-secondary">
                            {selectedPlan.duration === 'one_week' ? '1 Week Plan' : '2 Weeks Plan'}
                            {selectedPlan.no_repeat && ' • No Repeats'}
                          </p>
                          <p className="text-sm text-text-secondary">
                            Created: {new Date(selectedPlan.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteMealPlan(selectedPlan.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                        >
                          <FaTrash className="mr-1" />
                          Delete
                        </button>
                      </div>

                      <div className="space-y-6 mt-6">
                        {Object.entries(selectedPlan.plan).map(([day, meals]) => (
                          <div key={day} className="border border-border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-border">
                              <h3 className="font-medium text-primary">{day}</h3>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="flex items-center">
                                <div className="w-24 text-sm font-medium text-text-secondary">Breakfast:</div>
                                <div className="flex-1 text-primary">{meals.breakfast?.name || 'None'}</div>
                              </div>
                              <div className="flex items-center">
                                <div className="w-24 text-sm font-medium text-text-secondary">Lunch:</div>
                                <div className="flex-1 text-primary">{meals.lunch?.name || 'None'}</div>
                              </div>
                              <div className="flex items-center">
                                <div className="w-24 text-sm font-medium text-text-secondary">Dinner:</div>
                                <div className="flex-1 text-primary">{meals.dinner?.name || 'None'}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : isCreatingPlan ? (
                    /* Create New Plan View */
                    <div>
                      <div className="mb-6">
                        <button
                          onClick={() => setIsCreatingPlan(false)}
                          className="text-accent hover:text-highlight flex items-center text-sm"
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
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            placeholder="e.g., Weekly Family Meals"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            Duration
                          </label>
                          <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                className="form-radio text-accent"
                                name="duration"
                                value="one_week"
                                checked={duration === 'one_week'}
                                onChange={() => setDuration('one_week')}
                              />
                              <span className="ml-2">One Week</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                className="form-radio text-accent"
                                name="duration"
                                value="two_weeks"
                                checked={duration === 'two_weeks'}
                                onChange={() => setDuration('two_weeks')}
                              />
                              <span className="ml-2">Two Weeks</span>
                            </label>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="form-checkbox text-accent"
                              checked={noRepeat}
                              onChange={() => setNoRepeat(!noRepeat)}
                            />
                            <span className="ml-2">No Repeat Meals</span>
                          </label>
                          {noRepeat && (
                            <div className="mt-2 text-xs text-amber-600 flex items-start">
                              <FaExclamationTriangle className="mr-1 mt-0.5 flex-shrink-0" />
                              <span>
                                This requires {duration === 'one_week' ? '21' : '42'} different foods 
                                (you have {favoriteFoods.length})
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={generateMealPlan}
                          disabled={isGenerating || favoriteFoods.length === 0}
                          className="w-full bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md flex items-center justify-center mb-4 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
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
                              .slice(0, duration === 'one_week' ? 7 : 14)
                              .map(([day, meals]) => (
                                <div key={day} className="border border-border rounded-lg overflow-hidden">
                                  <div className="bg-gray-50 px-4 py-2 border-b border-border">
                                    <h4 className="font-medium text-primary">{day}</h4>
                                  </div>
                                  <div className="p-3 space-y-3">
                                    <div className="flex items-center">
                                      <div className="w-20 text-xs font-medium text-text-secondary">Breakfast:</div>
                                      <div className="flex-1 text-sm text-primary">{meals.breakfast?.name || 'None'}</div>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-20 text-xs font-medium text-text-secondary">Lunch:</div>
                                      <div className="flex-1 text-sm text-primary">{meals.lunch?.name || 'None'}</div>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-20 text-xs font-medium text-text-secondary">Dinner:</div>
                                      <div className="flex-1 text-sm text-primary">{meals.dinner?.name || 'None'}</div>
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={generateMealPlan}
                              className="flex-1 border border-accent text-accent hover:bg-accent hover:text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors duration-200"
                              disabled={isGenerating}
                            >
                              {isGenerating ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2"></div>
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
                              className="flex-1 bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
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
                        className="w-full bg-accent hover:bg-accent-dark text-white px-4 py-3 rounded-md flex items-center justify-center mb-6 transition-colors duration-200"
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
                            className="w-full px-4 py-3 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
                          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : filteredMealPlans.length === 0 ? (
                        <div className="bg-light border border-border rounded-lg p-8 text-center">
                          <div className="w-16 h-16 bg-accent bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCalendarAlt className="text-accent text-xl" />
                          </div>
                          <h3 className="text-xl font-medium text-primary mb-2">No meal plans found</h3>
                          <p className="text-text-secondary mb-6">
                            {searchTerm ? "No meal plans match your search criteria." : "You haven't created any meal plans yet."}
                          </p>
                          <button
                            onClick={() => setIsCreatingPlan(true)}
                            className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-md inline-flex items-center transition-colors duration-200"
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
                                  <span>{plan.duration === 'one_week' ? '1 Week Plan' : '2 Weeks Plan'}</span>
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
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                                  >
                                    <FaEdit className="mr-1" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => deleteMealPlan(plan.id)}
                                    className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 