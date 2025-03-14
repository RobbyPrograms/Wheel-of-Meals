'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaPlus, FaTrash } from 'react-icons/fa';

type Food = {
  id: string;
  name: string;
  ingredients: string;
};

export default function FoodsPage() {
  const { user, refreshSession } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [newFood, setNewFood] = useState({ name: '', ingredients: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFoods();
    } else {
      setLoading(false);
      setFoods([]);
    }
  }, [user]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        console.error('No authenticated user found');
        setError('You must be logged in to view your favorite foods');
        setLoading(false);
        return;
      }
      
      console.log('Fetching foods for user:', user.id);
      
      const { data, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching foods:', error);
        setError(`Failed to load foods: ${error.message}`);
        return;
      }

      console.log('Foods fetched:', data);
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
      console.error('No authenticated user found');
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
      
      console.log('Adding food:', foodData);
      
      const { data, error } = await supabase
        .from('favorite_foods')
        .insert(foodData)
        .select();

      if (error) {
        console.error('Error adding food:', error);
        
        // Check if it's a permission error
        if (error.code === '42501' || error.message.includes('permission')) {
          setError('Permission denied. Make sure RLS policies are set up correctly.');
        } 
        // Check if it's a foreign key constraint error
        else if (error.code === '23503') {
          setError('User ID not found. Please log out and log back in.');
        }
        // Check if it's a table doesn't exist error
        else if (error.code === '42P01') {
          setError('Table "favorite_foods" does not exist. Please set up your database correctly.');
        }
        else {
          setError(`Failed to add food: ${error.message}`);
        }
        return;
      }

      console.log('Food added successfully:', data);
      setSuccess('Food added successfully!');
      setNewFood({ name: '', ingredients: '' });
      await fetchFoods();
    } catch (err: any) {
      console.error('Unexpected error adding food:', err);
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
    } catch (err: any) {
      console.error('Unexpected error deleting food:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Your Favorite Foods</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New Food</h2>
          <form onSubmit={handleAddFood}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Food Name
              </label>
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newFood.name}
                onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                placeholder="e.g., Pizza"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="ingredients">
                Main Ingredients (optional)
              </label>
              <textarea
                id="ingredients"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newFood.ingredients}
                onChange={(e) => setNewFood({ ...newFood, ingredients: e.target.value })}
                placeholder="e.g., Dough, tomato sauce, cheese"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
              disabled={loading}
            >
              <FaPlus className="mr-2" />
              {loading ? 'Adding...' : 'Add Food'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Favorite Foods</h2>
          {loading && <p>Loading...</p>}
          {!loading && foods.length === 0 && (
            <p className="text-gray-500">You haven't added any favorite foods yet.</p>
          )}
          <ul className="space-y-2">
            {foods.map((food) => (
              <li
                key={food.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <h3 className="font-medium">{food.name}</h3>
                  {food.ingredients && (
                    <p className="text-sm text-gray-600">{food.ingredients}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteFood(food.id)}
                  className="text-red-500 hover:text-red-700"
                  disabled={loading}
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 