'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FavoriteFood } from '@/lib/supabase';
import { 
  FaSpinner, FaUtensils, FaTimes, FaPlus, FaUser, FaClock
} from 'react-icons/fa';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type Post = {
  id: string;
  user_id: string;
  food_id: string;
  caption: string | null;
  created_at: string;
  is_explore: boolean;
  food_name: string;
  food_ingredients: string[];
  food_recipe: string;
  food_meal_types: string[];
  food_visibility: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const [userFoods, setUserFoods] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchUserFoods();
    }
  }, [isOpen]);

  const fetchUserFoods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setUserFoods(data || []);
    } catch (err) {
      console.error('Error fetching user foods:', err);
      setError('Failed to load your meals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodId) {
      setError('Please select a meal to share');
      return;
    }
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('create_post', {
          p_food_id: selectedFoodId,
          p_caption: caption || null,
          p_is_explore: true
        });

      if (error) throw error;

      if (data) {
        onPostCreated(data);
        onClose();
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-primary">Create Post</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-primary transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-primary mb-2">
              Select a Meal to Share
            </label>
            {loading ? (
              <div className="flex justify-center py-8">
                <FaSpinner className="animate-spin text-accent" />
              </div>
            ) : userFoods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary mb-4">
                  You haven't added any meals yet.
                </p>
                <Link
                  href="/dashboard/foods"
                  className="inline-block bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Add Your First Meal
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userFoods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => setSelectedFoodId(food.id)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      selectedFoodId === food.id
                        ? 'border-accent bg-accent/5'
                        : 'border-gray-200 hover:border-accent/50'
                    }`}
                  >
                    <h3 className="font-medium text-primary mb-1">{food.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <FaUtensils />
                        {food.meal_types?.[0] || 'Any meal'}
                      </span>
                      {food.visibility === 'private' && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          Private
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-primary mb-2">
              Add a Caption (Optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your thoughts about this meal..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFoodId || loading}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ExplorePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('get_explore_posts');

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary">Explore</h1>
        <button
          onClick={() => setIsCreatePostModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <FaPlus /> Create Post
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <FaSpinner className="animate-spin text-accent text-2xl" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">No posts yet. Be the first to share!</p>
          <button
            onClick={() => setIsCreatePostModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <FaPlus /> Create Post
          </button>
        </div>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      {post.avatar_url ? (
                        <img
                          src={post.avatar_url}
                          alt={post.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        {post.display_name || post.username}
                      </p>
                      <p className="text-sm text-text-secondary">@{post.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <FaClock className="text-accent" />
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Meal Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-primary">{post.food_name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm text-text-secondary">
                      <FaUtensils className="text-accent" />
                      {post.food_meal_types?.[0] || 'Any meal'}
                    </span>
                    {post.food_visibility === 'private' && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        Private
                      </span>
                    )}
                  </div>
                </div>

                {post.caption && (
                  <p className="text-text-secondary mb-4 italic">"{post.caption}"</p>
                )}

                {/* Ingredients */}
                <div className="mb-4">
                  <h3 className="font-medium text-primary mb-2">Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.food_ingredients.map((ingredient, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-accent/5 text-accent rounded-md text-sm"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recipe */}
                {post.food_recipe && (
                  <div>
                    <h3 className="font-medium text-primary mb-2">Recipe</h3>
                    <p className="text-text-secondary text-sm whitespace-pre-wrap">
                      {post.food_recipe}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
} 