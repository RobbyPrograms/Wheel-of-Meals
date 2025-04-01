'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaPlus, FaTrash, FaUtensils, FaTimes, FaEdit, FaSave, FaChevronLeft, FaBook, FaStar as FaStarSolid, FaEye, FaEyeSlash, FaChevronRight, FaCompass, FaUserFriends, FaLightbulb, FaSearch } from 'react-icons/fa';
import { FaRegStar as FaStarOutline } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

type Food = {
  id: string;
  name: string;
  ingredients: string[];
  recipe: string;
  rating: number;
  meal_types: MealType[];
};

interface FoodsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded?: () => void;
}

export default function FoodsPanel({ isOpen, onClose, onFoodAdded }: FoodsPanelProps) {
  const { user, refreshSession } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [newFood, setNewFood] = useState({ 
    name: '', 
    ingredients: '', 
    recipe: '',
    rating: 0,
    meal_types: [] as MealType[],
    visibility: 'public' as 'public' | 'private'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    mealTypes: [] as MealType[],
    minRating: 0
  });
  const [errorNotification, setErrorNotification] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });

  useEffect(() => {
    if (isOpen && user) {
      fetchFoods();
    }
  }, [isOpen, user]);

  // Add useEffect to prevent background scrolling when panel is open
  useEffect(() => {
    if (isOpen) {
      // Only prevent scrolling on desktop
      if (window.innerWidth >= 640) { // sm breakpoint
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Add useEffect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen && window.innerWidth >= 640) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Add useEffect to clear error notification after 3 seconds
  useEffect(() => {
    if (errorNotification.show) {
      const timer = setTimeout(() => {
        setErrorNotification({ show: false, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorNotification.show]);

  const fetchFoods = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('favorite_foods')
        .select('id, name, ingredients, recipe, rating, meal_types')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setFoods(data || []);
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError('Failed to fetch foods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorNotification({ show: false, message: '' });

    // Convert comma-separated ingredients to array
    const ingredientsArray = newFood.ingredients
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    // Convert meal types to array
    const mealTypesArray = newFood.meal_types.length > 0 ? newFood.meal_types : [];

    try {
      const { error } = await supabase
        .from('favorite_foods')
        .insert([
          {
            user_id: user?.id,
            name: newFood.name,
            ingredients: ingredientsArray,
            recipe: newFood.recipe,
            rating: newFood.rating,
            meal_types: mealTypesArray,
            visibility: newFood.visibility
          }
        ]);

      if (error) {
        console.error('Error adding food:', error);
        if (error.code === '23505') {
          setErrorNotification({
            show: true,
            message: `"${newFood.name}" already exists in your food collection`
          });
        } else {
          setErrorNotification({
            show: true,
            message: 'Failed to add food. Please try again.'
          });
        }
        return;
      }

      // Clear form and close modal
      setNewFood({ 
        name: '', 
        ingredients: '', 
        recipe: '', 
        rating: 0, 
        meal_types: [],
        visibility: 'public'
      });
      setIsAddingFood(false);
      
      // Refresh foods list
      fetchFoods();
      if (onFoodAdded) onFoodAdded();
    } catch (error) {
      console.error('Error adding food:', error);
      setErrorNotification({
        show: true,
        message: 'Failed to add food. Please try again.'
      });
    }
  };

  const handleUpdateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('favorite_foods')
        .update({
          name: editingFood.name,
          ingredients: editingFood.ingredients,
          recipe: editingFood.recipe
        })
        .eq('id', editingFood.id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error updating food:', error);
        setError(`Failed to update food: ${error.message}`);
        return;
      }

      setSuccess('Food updated successfully!');
      setEditingFood(null);
      await fetchFoods();
      if (onFoodAdded) onFoodAdded();
    } catch (err: any) {
      console.error('Unexpected error updating food:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFood = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase
        .from('favorite_foods')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting food:', error);
        setError(`Failed to delete food: ${error.message}`);
        return;
      }

      setSuccess('Food deleted successfully!');
      await fetchFoods();
      if (onFoodAdded) onFoodAdded();
    } catch (err: any) {
      console.error('Unexpected error deleting food:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (Array.isArray(food.ingredients) && food.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesMealType = filters.mealTypes.length === 0 || 
      (food.meal_types && food.meal_types.some(type => filters.mealTypes.includes(type)));
    
    const matchesRating = filters.minRating === 0 ? true : food.rating === filters.minRating;

    return matchesSearch && matchesMealType && matchesRating;
  });

  const startEditing = (food: Food) => {
    setEditingFood(food);
  };

  const cancelEditing = () => {
    setEditingFood(null);
  };

  const mealTypeOptions: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];

  const handleMealTypeToggle = (type: MealType) => {
    setNewFood(prev => {
      const types = prev.meal_types.includes(type)
        ? prev.meal_types.filter(t => t !== type)
        : [...prev.meal_types, type];
      return { ...prev, meal_types: types };
    });
  };

  const handleRatingChange = (rating: number) => {
    setNewFood(prev => ({ ...prev, rating }));
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    const ratingId = Math.random().toString(36).substring(2, 9);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`rating-${ratingId}-${star}`}
            type="button"
            onClick={() => onRatingChange(star)}
            className="text-xl focus:outline-none"
          >
            {star <= rating ? (
              <FaStarSolid className="text-yellow-400" />
            ) : (
              <FaStarOutline className="text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingFood) return;

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('favorite_foods')
        .update({
          name: editingFood.name,
          ingredients: editingFood.ingredients,
          recipe: editingFood.recipe,
          rating: editingFood.rating,
          meal_types: editingFood.meal_types,
        })
        .eq('id', editingFood.id);

      if (updateError) throw updateError;

      setSuccess('Food updated successfully!');
      setEditingFood(null);
      await fetchFoods();
    } catch (err) {
      console.error('Error updating food:', err);
      setError('Failed to update food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMealTypeToggle = (type: MealType) => {
    if (!editingFood) return;
    
    setEditingFood(prev => {
      if (!prev) return prev;
      const types = prev.meal_types.includes(type)
        ? prev.meal_types.filter(t => t !== type)
        : [...prev.meal_types, type];
      return { ...prev, meal_types: types };
    });
  };

  const handleEditRatingChange = (rating: number) => {
    if (!editingFood) return;
    setEditingFood(prev => prev ? { ...prev, rating } : prev);
  };

  return (
    <>
      {/* Error Notification */}
      <AnimatePresence>
        {errorNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[70] bg-red-50 text-red-600 px-4 py-3 rounded-xl shadow-lg border border-red-100 flex items-center gap-2"
          >
            <div className="text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            {errorNotification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="foods-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-b-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl max-h-screen sm:max-h-[80vh] flex flex-col my-0 sm:my-2"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white z-10 rounded-t-2xl border-b border-gray-100">
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FaUtensils className="text-[#319141] text-xl" />
                    <h2 className="text-2xl font-bold text-[#0F1E0F]">My Foods</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-[#0F1E0F] transition-colors p-2"
                  >
                    ✕
                  </button>
                </div>

                {/* Add New Food Button - Always visible */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setIsAddingFood(true)}
                    className="w-full bg-[#319141] text-white p-3 rounded-xl hover:bg-[#0F1E0F] transition-colors flex items-center justify-center gap-2"
                  >
                    <FaPlus className="text-sm" />
                    Add New Food
                  </button>
                </div>

                {/* Search and Filters Section */}
                <div className="px-4 pb-4 space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search foods by name or ingredient"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 pr-10 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-[#319141] focus:ring-1 focus:ring-[#319141]"
                    />
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#0F1E0F] mb-2">
                        Filter by Meal Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {mealTypeOptions.map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setFilters(prev => ({
                                ...prev,
                                mealTypes: prev.mealTypes.includes(type)
                                  ? prev.mealTypes.filter(t => t !== type)
                                  : [...prev.mealTypes, type]
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              filters.mealTypes.includes(type)
                                ? 'bg-[#319141] text-white'
                                : 'bg-[#319141]/10 text-[#319141] hover:bg-[#319141]/20'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F1E0F] mb-2">
                        Minimum Rating
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                            className={`min-w-[40px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              filters.minRating === rating
                                ? 'bg-[#319141] text-white'
                                : 'bg-[#319141]/10 text-[#319141] hover:bg-[#319141]/20'
                            }`}
                          >
                            {rating === 0 ? 'All' : `${rating}★`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 pb-32">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="w-8 h-8 border-4 border-[#319141] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : foods.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredFoods.map((food) => (
                      <div 
                        key={food.id}
                        className="bg-[#319141]/5 rounded-xl p-4 hover:bg-[#319141]/10 transition-colors cursor-pointer"
                        onClick={() => setSelectedFood(food)}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-[#0F1E0F] mb-1">{food.name}</h3>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {food.meal_types?.map((type: string, index: number) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-0.5 bg-[#319141]/10 text-[#319141] rounded text-xs"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {food.rating > 0 && (
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStarSolid
                                      key={star}
                                      className={`w-3.5 h-3.5 ${star <= food.rating ? "text-yellow-400" : "text-gray-200"}`}
                                    />
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(food);
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-[#319141] transition-colors"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFood(food.id);
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {Array.isArray(food.ingredients) 
                              ? food.ingredients.join(', ') 
                              : food.ingredients || 'No ingredients listed'
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#319141]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaUtensils className="text-[#319141] text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F1E0F] mb-2">No foods added yet</h3>
                    <p className="text-gray-600 mb-4">Start building your collection of favorite meals</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Food Modal */}
      <AnimatePresence>
        {isAddingFood && (
          <motion.div
            key="add-food-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center sm:items-center pt-4 sm:p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mb-4 sm:my-2">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#319141]">Add New Food</h3>
                <button
                  onClick={() => setIsAddingFood(false)}
                  className="text-gray-500 hover:text-[#0F1E0F] transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleAddFood} className="p-6 space-y-4 pb-24">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newFood.name}
                    onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ingredients" className="block text-sm font-medium text-text-secondary mb-2">
                    Ingredients (comma-separated)
                  </label>
                  <textarea
                    id="ingredients"
                    value={newFood.ingredients}
                    onChange={(e) => setNewFood({ ...newFood, ingredients: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="recipe" className="block text-sm font-medium text-text-secondary mb-2">
                    Recipe Instructions
                  </label>
                  <textarea
                    id="recipe"
                    value={newFood.recipe}
                    onChange={(e) => setNewFood({ ...newFood, recipe: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[150px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Rating
                  </label>
                  <StarRating rating={newFood.rating} onRatingChange={handleRatingChange} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Meal Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {mealTypeOptions.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleMealTypeToggle(type)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          newFood.meal_types.includes(type)
                            ? 'bg-accent text-white'
                            : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Visibility
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setNewFood({ ...newFood, visibility: 'public' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        newFood.visibility === 'public'
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      <FaEye /> Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFood({ ...newFood, visibility: 'private' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        newFood.visibility === 'private'
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      <FaEyeSlash /> Private
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingFood(false)}
                    className="px-6 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-accent text-white hover:bg-highlight transition-colors"
                  >
                    Add Food
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Food Details Modal */}
      {selectedFood && (
        <motion.div
          key="food-details-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center sm:items-center pt-4 sm:p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mb-4 sm:my-2">
            <div className="sticky top-0 bg-white border-b border-gray-100 flex justify-between items-center p-4">
              <div>
                <h3 className="text-xl font-semibold text-[#319141] mb-2">{selectedFood.name}</h3>
                {selectedFood.rating > 0 && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStarSolid
                        key={star}
                        className={star <= selectedFood.rating ? "text-yellow-400" : "text-gray-200"}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-gray-500 hover:text-[#0F1E0F] transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-medium text-[#0F1E0F] mb-2">Meal Types</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFood.meal_types?.map((type: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-[#319141]/10 text-[#319141] rounded text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-[#0F1E0F] mb-2">Ingredients</h4>
                <ul className="list-disc list-inside space-y-1">
                  {Array.isArray(selectedFood.ingredients) 
                    ? selectedFood.ingredients.map((ingredient, index) => (
                        <li key={index} className="text-gray-600">{ingredient}</li>
                      ))
                    : <li className="text-gray-600">No ingredients listed</li>
                  }
                </ul>
              </div>
              {selectedFood.recipe && (
                <div>
                  <h4 className="font-medium text-[#0F1E0F] mb-2">Instructions</h4>
                  <ol className="list-none space-y-2">
                    {selectedFood.recipe.split('\n')
                      .filter(step => step.trim() !== '')
                      .map((step, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-[#319141] font-medium">{index + 1}.</span>
                          <span className="text-gray-600">{step}</span>
                        </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Food Modal */}
      {editingFood && (
        <motion.div
          key="edit-food-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center sm:items-center pt-4 sm:p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto mb-4 sm:my-2">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#319141]">Edit Food</h3>
              <button
                onClick={() => setEditingFood(null)}
                className="text-gray-500 hover:text-[#0F1E0F] transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditFood} className="p-6 space-y-4 pb-24">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-text-secondary mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editingFood.name}
                  onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-ingredients" className="block text-sm font-medium text-text-secondary mb-2">
                  Ingredients (comma-separated)
                </label>
                <textarea
                  id="edit-ingredients"
                  value={Array.isArray(editingFood.ingredients) ? editingFood.ingredients.join(', ') : ''}
                  onChange={(e) => {
                    const ingredientsArray = e.target.value
                      .split(',')
                      .map(item => item.trim())
                      .filter(item => item.length > 0);
                    setEditingFood({ ...editingFood, ingredients: ingredientsArray });
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[100px]"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-recipe" className="block text-sm font-medium text-text-secondary mb-2">
                  Recipe Instructions
                </label>
                <textarea
                  id="edit-recipe"
                  value={editingFood.recipe}
                  onChange={(e) => setEditingFood({ ...editingFood, recipe: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-[150px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`edit-food-${editingFood.id}-star-${star}`}
                      type="button"
                      onClick={() => handleEditRatingChange(star)}
                      className="text-xl focus:outline-none"
                    >
                      {star <= editingFood.rating ? (
                        <FaStarSolid className="text-yellow-400" />
                      ) : (
                        <FaStarOutline className="text-gray-300 hover:text-yellow-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Meal Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {mealTypeOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleEditMealTypeToggle(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        editingFood.meal_types.includes(type)
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingFood(null)}
                  className="px-6 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-accent text-white hover:bg-highlight transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </>
  );
} 