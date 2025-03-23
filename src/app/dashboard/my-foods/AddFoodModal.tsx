import { useState } from 'react';
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AddFoodModalProps {
  onClose: () => void;
  onFoodAdded: () => void;
}

export default function AddFoodModal({ onClose, onFoodAdded }: AddFoodModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [recipe, setRecipe] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Filter out empty ingredients
      const filteredIngredients = ingredients.filter(i => i.trim() !== '');

      const { error: insertError } = await supabase
        .from('favorite_foods')
        .insert([{
          name,
          ingredients: filteredIngredients,
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-primary mb-4">Add New Food</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Ingredients
            </label>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter an ingredient"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddIngredient}
              className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
            >
              + Add Another Ingredient
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Recipe
            </label>
            <textarea
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              rows={4}
              required
            />
          </div>

          <div className="mb-6">
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
              <span className="text-sm font-medium text-text-secondary">
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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Food'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 