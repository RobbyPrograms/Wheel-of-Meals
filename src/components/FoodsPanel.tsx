'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaPlus, FaTrash, FaUtensils, FaTimes, FaEdit, FaSave, FaChevronLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

type Food = {
  id: string;
  name: string;
  ingredients: string;
};

interface FoodsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded?: () => void;
}

export default function FoodsPanel({ isOpen, onClose, onFoodAdded }: FoodsPanelProps) {
  const { user, refreshSession } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [newFood, setNewFood] = useState({ name: '', ingredients: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchFoods();
    }
  }, [isOpen, user]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setError('You must be logged in to view your favorite foods');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching foods:', error);
        setError(`Failed to load foods: ${error.message}`);
        return;
      }

      setFoods(data || []);
    } catch (err: any) {
      console.error('Unexpected error fetching foods:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!user) {
      setError('You must be logged in to add favorite foods');
      await refreshSession();
      return;
    }
    
    if (!newFood.name.trim()) {
      setError('Food name is required');
      return;
    }

    try {
      setLoading(true);
      
      const foodData = {
        user_id: user.id,
        name: newFood.name.trim(),
        ingredients: newFood.ingredients.trim(),
      };
      
      const { data, error } = await supabase
        .from('favorite_foods')
        .insert(foodData)
        .select();

      if (error) {
        console.error('Error adding food:', error);
        
        if (error.code === '42501' || error.message.includes('permission')) {
          setError('Permission denied. Make sure RLS policies are set up correctly.');
        } 
        else if (error.code === '23503') {
          setError('User ID not found. Please log out and log back in.');
        }
        else if (error.code === '42P01') {
          setError('Table "favorite_foods" does not exist. Please set up your database correctly.');
        }
        else {
          setError(`Failed to add food: ${error.message}`);
        }
        return;
      }

      setSuccess('Food added successfully!');
      setNewFood({ name: '', ingredients: '' });
      setIsAddingFood(false);
      await fetchFoods();
      if (onFoodAdded) onFoodAdded();
    } catch (err: any) {
      console.error('Unexpected error adding food:', err);
      setError(`An unexpected error occurred: ${err.message}`);
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
          ingredients: editingFood.ingredients
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
                              <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="ingredients">
                                Main Ingredients (optional)
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

                  {/* Foods List */}
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
                        <motion.div
                          key={food.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-white border border-border rounded-lg overflow-hidden shadow-sm"
                        >
                          {editingFood && editingFood.id === food.id ? (
                            <div className="p-5">
                              <form onSubmit={handleUpdateFood}>
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Food Name
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                    value={editingFood.name}
                                    onChange={(e) => setEditingFood({...editingFood, name: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Ingredients
                                  </label>
                                  <textarea
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                                    value={editingFood.ingredients}
                                    onChange={(e) => setEditingFood({...editingFood, ingredients: e.target.value})}
                                    rows={2}
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    type="submit"
                                    className="bg-accent hover:bg-accent-dark text-white px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                                  >
                                    <FaSave className="mr-1" />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                                  >
                                    <FaTimes className="mr-1" />
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <div className="p-5">
                              <h3 className="font-medium text-lg text-primary mb-2">{food.name}</h3>
                              <p className="text-text-secondary text-sm mb-4">
                                {food.ingredients || "No ingredients listed"}
                              </p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => startEditing(food)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                                >
                                  <FaEdit className="mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteFood(food.id)}
                                  className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-md flex items-center text-sm transition-colors duration-200"
                                >
                                  <FaTrash className="mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
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