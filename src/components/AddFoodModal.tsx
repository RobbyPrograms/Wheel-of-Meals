'use client';

import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AddFoodModalProps {
  onClose: () => void;
  onFoodAdded: () => void;
}

export default function AddFoodModal({ onClose, onFoodAdded }: AddFoodModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setError(null);

      const { error: insertError } = await supabase
        .from('favorite_foods')
        .insert([{
          name,
          meal_type: mealType,
          rating,
          ingredients: ingredients.split(',').map(i => i.trim()),
          recipe,
          user_id: user.id,
          visibility: isPublic ? 'public' : 'private'
        }]);

      if (insertError) throw insertError;

      onFoodAdded();
      onClose();
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food. Please try again.');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Add New Food</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Food Name</label>
          <input
            type="text"
            placeholder="e.g., Pizza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Meal Type</label>
          <div className="flex flex-wrap gap-2">
            {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`px-4 py-2 rounded-md ${
                  mealType === type
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-xl"
              >
                {star <= rating ? '★' : '☆'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Main Ingredients</label>
          <textarea
            placeholder="e.g., Dough, tomato sauce, cheese"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Recipe Instructions</label>
          <textarea
            placeholder="e.g., 1. Preheat oven to 450°F 2. Roll out the dough 3. Add toppings 4. Bake for 15-20 minutes"
            value={recipe}
            onChange={(e) => setRecipe(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={4}
            required
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isPublic ? 'bg-accent' : 'bg-gray-200'
              }`}
              onClick={() => setIsPublic(!isPublic)}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isPublic ? 'left-7' : 'left-1'
                }`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {isPublic ? (
                <span className="flex items-center gap-1">
                  <FaEye /> Public - Friends can see this meal
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <FaEyeSlash /> Private - Only you can see this meal
                </span>
              )}
            </span>
          </label>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Add Food
          </button>
        </div>
      </form>
    </div>
  );
} 