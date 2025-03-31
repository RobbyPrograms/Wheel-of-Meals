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

  useEffect(() => {
    if (isOpen && user) {
      fetchFoods();
    }
  }, [isOpen, user]);

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
        setError('Failed to add food. Please try again.');
        return;
      }

      // Clear form
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
      setError('Failed to add food. Please try again.');
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

  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (Array.isArray(food.ingredients) && food.ingredients.some(ingredient => 
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4 sm:pt-20 p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white z-10 rounded-t-2xl border-b border-gray-100">
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FaUtensils className="text-[#319141] text-xl" />
                  <h2 className="text-2xl font-bold text-[#0F1E0F]">My Foods</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-[#0F1E0F] transition-colors"
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

              {/* Search Bar - Always visible */}
              <div className="px-4 pb-4">
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
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-[#319141] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : foods.length > 0 ? (
                <div className="space-y-4">
                  {filteredFoods.map((food) => (
                    <div
                      key={food.id}
                      className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-accent/30 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-primary">{food.name}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditing(food)}
                            className="text-accent hover:text-highlight transition-colors"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteFood(food.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      {/* Rating Stars */}
                      <div className="mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={`food-${food.id}-rating-${star}`} className="text-lg">
                            {star <= (food.rating || 0) ? (
                              <FaStarSolid className="inline text-yellow-400" />
                            ) : (
                              <FaStarOutline className="inline text-gray-300" />
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Meal Types */}
                      {food.meal_types && food.meal_types.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {food.meal_types.map((type) => (
                            <span
                              key={type}
                              className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Ingredients */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Ingredients:</h4>
                        <div className="flex flex-wrap gap-2">
                          {food.ingredients.map((ingredient, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white rounded-lg text-sm text-text-secondary border border-gray-200"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recipe Preview */}
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Recipe:</h4>
                        <p className="text-sm text-text-secondary line-clamp-3">{food.recipe}</p>
                        <button
                          onClick={() => setSelectedFood(food)}
                          className="text-accent hover:text-highlight text-sm mt-2 flex items-center gap-1"
                        >
                          View Full Recipe
                          <FaChevronLeft className="transform rotate-180" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#319141]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUtensils className="text-[#319141] text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F1E0F] mb-2">No foods added yet</h3>
                  <p className="text-[#319141] mb-4">Start building your collection of favorite meals</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Food Modal */}
      {isAddingFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-primary">Add New Food</h3>
            </div>
            <form onSubmit={handleAddFood} className="p-6 space-y-4">
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
        </div>
      )}

      {/* View Recipe Modal */}
      {selectedFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-primary">{selectedFood.name}</h3>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-3">Ingredients:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFood.ingredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-50 rounded-lg text-sm text-text-secondary"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-3">Recipe Instructions:</h4>
                <div className="prose prose-sm max-w-none">
                  {selectedFood.recipe.split('\n').map((step, index) => (
                    <p key={index} className="mb-2">{step}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Food Modal */}
      {editingFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-primary">Edit Food</h3>
              <button
                onClick={() => setEditingFood(null)}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditFood} className="p-6 space-y-4">
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
        </div>
      )}
    </AnimatePresence>
  );
} 