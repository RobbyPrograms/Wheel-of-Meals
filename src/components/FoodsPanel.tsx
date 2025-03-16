'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaPlus, FaTrash, FaUtensils, FaTimes, FaEdit, FaSave, FaChevronLeft, FaBook, FaStar as FaStarSolid } from 'react-icons/fa';
import { FaRegStar as FaStarOutline } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

type Food = {
  id: string;
  name: string;
  ingredients: string;
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
    meal_types: [] as MealType[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
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
    if (!user) {
      setError('You must be logged in to add foods');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const foodData = {
        user_id: user.id,
        name: newFood.name.trim(),
        ingredients: newFood.ingredients.trim(),
        recipe: newFood.recipe.trim(),
        rating: newFood.rating,
        meal_types: newFood.meal_types,
      };
      
      const { error: insertError } = await supabase
        .from('favorite_foods')
        .insert([foodData]);

      if (insertError) throw insertError;

      setSuccess('Food added successfully!');
      setNewFood({ name: '', ingredients: '', recipe: '', rating: 0, meal_types: [] });
      setIsAddingFood(false);
      await fetchFoods();
      if (onFoodAdded) onFoodAdded();
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food. Please try again.');
    } finally {
      setLoading(false);
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
    food.ingredients.toLowerCase().includes(searchTerm.toLowerCase())
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
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
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
          name: editingFood.name.trim(),
          ingredients: editingFood.ingredients.trim(),
          recipe: editingFood.recipe.trim(),
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
                    <h2 className="text-xl font-semibold text-primary">My Foods</h2>
                    <button 
                      onClick={onClose}
                      className="text-text-secondary hover:text-primary transition-colors"
                    >
                      <FaTimes className="text-lg" />
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

                  {/* Add Food Button */}
                  {!isAddingFood && (
                    <button
                      onClick={() => setIsAddingFood(true)}
                      className="w-full bg-accent hover:bg-accent-dark text-white px-4 py-3 rounded-md flex items-center justify-center mb-6 transition-colors duration-200"
                    >
                      <FaPlus className="mr-2" />
                      Add New Food
                    </button>
                  )}

                  {/* Add Food Form */}
                  <AnimatePresence>
                    {isAddingFood && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                      >
                        <div className="bg-light border border-border rounded-lg p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-primary">Add New Food</h3>
                            <button 
                              onClick={() => setIsAddingFood(false)}
                              className="text-text-secondary hover:text-primary"
                            >
                              <FaTimes />
                            </button>
                          </div>
                          <form onSubmit={handleAddFood}>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="name">
                                Food Name
                              </label>
                              <input
                                id="name"
                                type="text"
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                value={newFood.name}
                                onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                                placeholder="e.g., Pizza"
                                required
                              />
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-text-secondary mb-1">
                                Meal Type
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {mealTypeOptions.map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleMealTypeToggle(type)}
                                    className={`px-3 py-1 rounded-full text-sm ${
                                      newFood.meal_types.includes(type)
                                        ? 'bg-accent text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-text-secondary mb-1">
                                Rating
                              </label>
                              <StarRating rating={newFood.rating} onRatingChange={handleRatingChange} />
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="ingredients">
                                Main Ingredients
                              </label>
                              <textarea
                                id="ingredients"
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                value={newFood.ingredients}
                                onChange={(e) => setNewFood({ ...newFood, ingredients: e.target.value })}
                                placeholder="e.g., Dough, tomato sauce, cheese"
                                rows={3}
                              />
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="recipe">
                                Recipe Instructions
                              </label>
                              <textarea
                                id="recipe"
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                value={newFood.recipe}
                                onChange={(e) => setNewFood({ ...newFood, recipe: e.target.value })}
                                placeholder="e.g., 1. Preheat oven to 450°F&#10;2. Roll out the dough&#10;3. Add toppings&#10;4. Bake for 15-20 minutes"
                                rows={5}
                              />
                            </div>
                            <div className="flex justify-end space-x-3">
                              <button
                                type="button"
                                onClick={() => setIsAddingFood(false)}
                                className="px-4 py-2 border border-border rounded-md text-text-primary hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md flex items-center transition-colors duration-200"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <FaPlus className="mr-2" />
                                    Add Food
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search your foods..."
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

                  {/* Food List */}
                  {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : filteredFoods.length === 0 ? (
                    <div className="bg-light border border-border rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-accent bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUtensils className="text-accent text-xl" />
                      </div>
                      <h3 className="text-xl font-medium text-primary mb-2">No foods found</h3>
                      <p className="text-text-secondary mb-6">
                        {searchTerm ? "No foods match your search criteria." : "You haven't added any favorite foods yet."}
                      </p>
                      <button
                        onClick={() => setIsAddingFood(true)}
                        className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-md inline-flex items-center transition-colors duration-200"
                      >
                        <FaPlus className="mr-2" />
                        Add Your First Food
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFoods.map((food) => (
                        <div
                          key={food.id}
                          className="bg-white border border-border rounded-lg hover:border-accent transition-colors duration-200"
                        >
                          <div 
                            className="p-4 cursor-pointer"
                            onClick={() => setSelectedFood(food)}
                          >
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-primary mb-1">{food.name}</h3>
                              <div className="flex items-center gap-4 mb-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStarSolid
                                      key={star}
                                      className={`text-sm ${
                                        star <= food.rating ? 'text-yellow-400' : 'text-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {food.meal_types.map((type) => (
                                    <span
                                      key={type}
                                      className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs"
                                    >
                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-text-secondary line-clamp-2">
                                {food.ingredients}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-border px-4 py-2 bg-gray-50 flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedFood(food)}
                              className="p-2 text-text-secondary hover:text-primary transition-colors flex items-center gap-1 text-sm"
                              title="View details"
                            >
                              <FaBook className="text-base" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => startEditing(food)}
                              className="p-2 text-text-secondary hover:text-primary transition-colors flex items-center gap-1 text-sm"
                              title="Edit food"
                            >
                              <FaEdit className="text-base" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteFood(food.id)}
                              className="p-2 text-text-secondary hover:text-red-500 transition-colors flex items-center gap-1 text-sm"
                              title="Delete food"
                            >
                              <FaTrash className="text-base" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Food Detail Modal */}
          <AnimatePresence>
            {selectedFood && (
              <motion.div
                className="fixed inset-0 z-50 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedFood(null)}></div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <motion.div
                    className="bg-white rounded-xl shadow-xl w-full max-w-lg"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-primary">{selectedFood.name}</h2>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStarSolid
                                  key={star}
                                  className={star <= selectedFood.rating ? 'text-yellow-400' : 'text-gray-200'}
                                />
                              ))}
                            </div>
                            <div className="flex gap-2">
                              {selectedFood.meal_types.map((type) => (
                                <span
                                  key={type}
                                  className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs"
                                >
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFood(null)}
                          className="text-text-secondary hover:text-primary transition-colors"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-2">Ingredients</h3>
                          <div className="bg-gray-50 rounded-lg p-4">
                            {selectedFood.ingredients ? (
                              <div className="space-y-2">
                                {selectedFood.ingredients.split(',').map((ingredient, index) => (
                                  <div key={index} className="flex items-center">
                                    <span className="w-2 h-2 bg-accent rounded-full mr-2"></span>
                                    <span className="text-text-secondary">{ingredient.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-text-secondary italic">No ingredients listed</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-2">Recipe Instructions</h3>
                          <div className="bg-gray-50 rounded-lg p-4">
                            {selectedFood.recipe ? (
                              <div className="space-y-2">
                                {selectedFood.recipe.split('\n').map((step, index) => (
                                  <div key={index} className="flex items-start">
                                    <span className="text-accent font-medium mr-2">{index + 1}.</span>
                                    <span className="text-text-secondary">{step.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-text-secondary italic">No recipe instructions available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Food Modal */}
          <AnimatePresence>
            {editingFood && (
              <motion.div
                className="fixed inset-0 z-50 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setEditingFood(null)}></div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <motion.div
                    className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-primary">Edit Food</h2>
                        <button
                          onClick={() => setEditingFood(null)}
                          className="text-text-secondary hover:text-primary transition-colors"
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <form onSubmit={handleEditFood} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="edit-name">
                            Food Name
                          </label>
                          <input
                            id="edit-name"
                            type="text"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            value={editingFood.name}
                            onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            Meal Type
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {mealTypeOptions.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleEditMealTypeToggle(type)}
                                className={`px-3 py-1 rounded-full text-sm ${
                                  editingFood.meal_types.includes(type)
                                    ? 'bg-accent text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">
                            Rating
                          </label>
                          <StarRating rating={editingFood.rating} onRatingChange={handleEditRatingChange} />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="edit-ingredients">
                            Main Ingredients
                          </label>
                          <textarea
                            id="edit-ingredients"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            value={editingFood.ingredients}
                            onChange={(e) => setEditingFood({ ...editingFood, ingredients: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="edit-recipe">
                            Recipe Instructions
                          </label>
                          <textarea
                            id="edit-recipe"
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                            value={editingFood.recipe}
                            onChange={(e) => setEditingFood({ ...editingFood, recipe: e.target.value })}
                            rows={5}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <button
                            type="button"
                            onClick={() => setEditingFood(null)}
                            className="px-4 py-2 border border-border rounded-md text-text-primary hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 