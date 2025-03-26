'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FavoriteFood } from '@/lib/supabase';
import { 
  FaSpinner, FaUtensils, FaTimes, FaPlus, FaUser, FaClock,
  FaGlobe, FaUserCircle, FaTrash, FaEllipsisV,
  FaHeart, FaRegHeart, FaRetweet, FaChartLine
} from 'react-icons/fa';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { usePathname } from 'next/navigation';

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
  likes_count: number;
  reposts_count: number;
  is_liked: boolean;
  is_reposted: boolean;
  reposted_by_username: string | null;
  reposted_by_display_name: string | null;
  repost_created_at: string | null;
};

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  onRefresh: () => Promise<void>;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated, onRefresh }) => {
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
      // Create the post (selectedFoodId is already a UUID string)
      const { data: postData, error: postError } = await supabase
        .rpc('create_post', {
          p_food_id: selectedFoodId,
          p_caption: caption || null,
          p_is_explore: true
        });

      if (postError) {
        console.error('Post creation error:', postError);
        throw new Error(postError.message || 'Failed to create post');
      }

      if (!postData || postData.length === 0) {
        throw new Error('No post data returned');
      }

      // Transform the data to match our frontend Post type
      const transformedPost: Post = {
        ...postData[0],
        id: postData[0].id,
        food_id: postData[0].food_id,
        likes_count: postData[0].likes_count || 0,
        reposts_count: postData[0].reposts_count || 0,
        is_liked: postData[0].is_liked || false,
        is_reposted: postData[0].is_reposted || false,
        reposted_by_username: null,
        reposted_by_display_name: null,
        repost_created_at: null,
        food_ingredients: Array.isArray(postData[0].food_ingredients) 
          ? postData[0].food_ingredients 
          : [],
        food_meal_types: Array.isArray(postData[0].food_meal_types)
          ? postData[0].food_meal_types
          : []
      };

      onPostCreated(transformedPost);
      onClose();
      await onRefresh();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err?.message || 'Failed to create post. Please try again.');
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
  const [viewMode, setViewMode] = useState<'explore' | 'trending' | 'my-posts'>('explore');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const pathname = usePathname();

  const fetchPosts = async () => {
    try {
      if (!user) {
        console.log('No authenticated user found');
        setError('Please sign in to view posts');
        return;
      }

      setLoading(true);
      setError(null);
      
      let functionName = 'get_explore_posts';
      if (viewMode === 'my-posts') {
        functionName = 'get_user_posts';
      } else if (viewMode === 'trending') {
        functionName = 'get_trending_posts';
      }

      console.log('Fetching posts with function:', functionName);
      console.log('Current user:', user.id);
      
      // Only pass parameters for get_user_posts
      const { data, error: rpcError } = await supabase.rpc(
        functionName, 
        functionName === 'get_user_posts' ? { p_user_id: user.id } : {}
      );
      
      if (rpcError) {
        console.error('Supabase RPC error details:', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code
        });
        // Check if it's a permissions error
        if (rpcError.message.includes('permission denied')) {
          setError('Permission denied. Please check your access rights.');
        } else if (rpcError.message.includes('Not authenticated')) {
          setError('Please sign in again to view posts');
        } else {
          setError(`Error loading posts: ${rpcError.message}`);
        }
        return;
      }

      if (!data || !Array.isArray(data)) {
        console.log('No data returned from posts query or data is not an array');
        setPosts([]);
        return;
      }

      // Log raw data for debugging
      console.log('Raw data from database:', data);

      // Transform the data to ensure proper types
      const transformedPosts = data.map((post: any) => {
        // Helper function to safely convert to number
        const safeNumber = (value: any) => {
          if (typeof value === 'bigint') return Number(value);
          if (typeof value === 'string') return parseInt(value, 10) || 0;
          if (typeof value === 'number') return value;
          return 0;
        };

        // Helper function to safely parse JSON string or return default
        const safeJsonParse = (value: any, defaultValue: any[] = []) => {
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : defaultValue;
            } catch {
              return defaultValue;
            }
          }
          return defaultValue;
        };

        // Log individual post data for debugging
        console.log('Processing post:', post);
        
        return {
          id: String(post.id || ''),
          user_id: String(post.user_id || ''),
          food_id: String(post.food_id || ''),
          caption: post.caption || null,
          created_at: post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString(),
          is_explore: Boolean(post.is_explore),
          food_name: String(post.food_name || ''),
          food_ingredients: safeJsonParse(post.food_ingredients),
          food_recipe: String(post.food_recipe || ''),
          food_meal_types: safeJsonParse(post.food_meal_types),
          food_visibility: String(post.food_visibility || 'public'),
          username: String(post.username || ''),
          display_name: post.display_name || null,
          avatar_url: post.avatar_url || null,
          likes_count: safeNumber(post.likes_count),
          reposts_count: safeNumber(post.reposts_count),
          is_liked: Boolean(post.is_liked),
          is_reposted: Boolean(post.is_reposted),
          reposted_by_username: post.reposted_by_username || null,
          reposted_by_display_name: post.reposted_by_display_name || null,
          repost_created_at: post.repost_created_at 
            ? new Date(post.repost_created_at).toISOString() 
            : null
        };
      });

      console.log('Transformed posts:', transformedPosts.length, 'posts');
      if (transformedPosts.length > 0) {
        console.log('Sample transformed post:', transformedPosts[0]);
      }
      setPosts(transformedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching posts...');
      fetchPosts();
    } else {
      console.log('No user, skipping post fetch');
    }
  }, [user, viewMode]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.rpc('delete_post', {
        p_post_id: postId
      });

      if (error) throw error;

      // Remove the post from the state
      setPosts(prev => prev.filter(post => post.id !== postId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post. Please try again.');
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId
      });

      if (error) throw error;

      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: data[0].is_liked,
            likes_count: data[0].likes_count
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like. Please try again.');
    }
  };

  const handleRepostPost = async (postId: string) => {
    try {
      const { data, error } = await supabase.rpc('toggle_post_repost', {
        p_post_id: postId
      });

      if (error) throw error;

      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_reposted: data[0].is_reposted,
            reposts_count: data[0].reposts_count
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Error toggling repost:', err);
      setError('Failed to update repost. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Explore</h1>
          <Link
            href="/dashboard/create"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              setIsCreatePostModalOpen(true);
            }}
          >
            <FaPlus className="w-5 h-5" /> Create Post
          </Link>
        </div>

        <div className="flex gap-2 bg-white rounded-lg shadow-sm p-2">
          <button
            onClick={() => setViewMode('explore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'explore'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-primary hover:bg-gray-50'
            }`}
          >
            <FaGlobe className="w-4 h-4" />
            Explore
          </button>
          <button
            onClick={() => setViewMode('trending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'trending'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-primary hover:bg-gray-50'
            }`}
          >
            <FaChartLine className="w-4 h-4" />
            Trending
          </button>
          <button
            onClick={() => setViewMode('my-posts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'my-posts'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-primary hover:bg-gray-50'
            }`}
          >
            <FaUser className="w-4 h-4" />
            My Posts
          </button>
        </div>
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
          <p className="text-text-secondary mb-4">
            {viewMode === 'explore' 
              ? 'No posts yet. Be the first to share!'
              : viewMode === 'trending'
              ? 'No trending posts yet. Check back later for new posts!'
              : 'You haven\'t created any posts yet.'}
          </p>
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <FaPlus /> Create Post
          </Link>
        </div>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <div 
              key={post.reposted_by_username 
                ? `repost-${post.id}-${post.reposted_by_username}-${post.repost_created_at}` 
                : post.id
              } 
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* Repost Info */}
              {post.reposted_by_username && (
                <div className="px-6 pt-4 flex items-center gap-2 text-sm text-text-secondary">
                  <FaRetweet className="text-green-500" />
                  <span>
                    {post.reposted_by_display_name || post.reposted_by_username} reposted
                  </span>
                </div>
              )}

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
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-text-secondary">
                      <FaClock className="inline mr-1 text-accent" />
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </div>
                    {post.user_id === user?.id && (
                      <div className="relative">
                        <button
                          onClick={() => setDeleteConfirm(deleteConfirm === post.id ? null : post.id)}
                          className="p-2 text-text-secondary hover:text-primary transition-colors rounded-full hover:bg-gray-100"
                        >
                          <FaEllipsisV />
                        </button>
                        {deleteConfirm === post.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete Post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
                      {Array.isArray(post.food_meal_types) && post.food_meal_types.length > 0
                        ? post.food_meal_types[0]
                        : 'Any meal'}
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
                    {Array.isArray(post.food_ingredients) ? (
                      post.food_ingredients.map((ingredient, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-accent/5 text-accent rounded-md text-sm"
                        >
                          {ingredient}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-secondary text-sm">No ingredients listed</span>
                    )}
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

              {/* Post Actions */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-6">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    post.is_liked
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-text-secondary hover:text-red-500'
                  }`}
                >
                  {post.is_liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{post.likes_count || ''}</span>
                </button>

                <button
                  onClick={() => handleRepostPost(post.id)}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    post.is_reposted
                      ? 'text-green-500 hover:text-green-600'
                      : 'text-text-secondary hover:text-green-500'
                  }`}
                >
                  <FaRetweet />
                  <span>{post.reposts_count || ''}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={handlePostCreated}
        onRefresh={fetchPosts}
      />
    </div>
  );
} 