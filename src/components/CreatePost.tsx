import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import ImageUpload from './ImageUpload';

export default function CreatePost() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Create post with optional image
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            title,
            ingredients: ingredients.split(',').map(i => i.trim()),
            recipe: recipe.split('\n'),
            user_id: user.id,
            image_url: imageUrl
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setTitle('');
      setIngredients('');
      setRecipe('');
      setImageUrl(null);

      // You might want to trigger a refresh of posts here
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  const handleImageClear = () => {
    setImageUrl(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          placeholder="e.g., BBQ Chicken Pizza"
          required
        />
      </div>

      <div>
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-2">
          Ingredients
        </label>
        <input
          type="text"
          id="ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          placeholder="Enter ingredients separated by commas"
          required
        />
      </div>

      <div>
        <label htmlFor="recipe" className="block text-sm font-medium text-gray-700 mb-2">
          Recipe Steps
        </label>
        <textarea
          id="recipe"
          value={recipe}
          onChange={(e) => setRecipe(e.target.value)}
          className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          placeholder="Enter recipe steps (one per line)"
          rows={5}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image
        </label>
        <ImageUpload
          onUpload={handleImageUpload}
          onClear={handleImageClear}
          url={imageUrl}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Creating Post...' : 'Create Post'}
      </button>
    </form>
  );
} 