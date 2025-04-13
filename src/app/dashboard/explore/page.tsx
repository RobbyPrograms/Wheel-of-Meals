'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FavoriteFood } from '@/lib/supabase';
import { 
  FaSpinner, FaUtensils, FaTimes, FaPlus, FaUser, FaClock,
  FaGlobe, FaUserCircle, FaTrash, FaEllipsisV,
  FaHeart, FaRegHeart, FaRetweet, FaChartLine, FaCheck, FaUserPlus
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
  friend_status?: 'pending' | 'accepted' | null;
  is_friend_request_sender?: boolean;
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
          : [],
        friend_status: null,
        is_friend_request_sender: false
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
  const [sendingFriendRequest, setSendingFriendRequest] = useState<string | null>(null);
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
      
      // Get posts
      const { data: postsData, error: rpcError } = await supabase.rpc(
        functionName, 
        functionName === 'get_user_posts' ? { p_user_id: user.id } : {}
      );
      
      if (rpcError) {
        console.error('Supabase RPC error details:', rpcError);
        if (rpcError.message.includes('permission denied')) {
          setError('Permission denied. Please check your access rights.');
        } else if (rpcError.message.includes('Not authenticated')) {
          setError('Please sign in again to view posts');
        } else {
          setError(`Error loading posts: ${rpcError.message}`);
        }
        return;
      }

      // Get friend statuses
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendsError) {
        console.error('Error fetching friend statuses:', friendsError);
      }

      // Transform the data to ensure proper types
      const transformedPosts = postsData.map((post: any) => {
        // Find friend status for this post's user
        const friendRelation = friendsData?.find(f => 
          (f.user_id === user.id && f.friend_id === post.user_id) ||
          (f.friend_id === user.id && f.user_id === post.user_id)
        );

        return {
          ...post,
          friend_status: friendRelation?.status || null,
          is_friend_request_sender: friendRelation ? friendRelation.user_id === user.id : false
        };
      });

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

  const handleFriendRequest = async (postUserId: string, username: string) => {
    if (!user) return;
    
    try {
      setSendingFriendRequest(postUserId);
      setError(null);

      // Check if friend request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${postUserId}),and(user_id.eq.${postUserId},friend_id.eq.${user.id})`);

      if (checkError) throw checkError;

      if (existingRequest && existingRequest.length > 0) {
        setError('Friend request already exists.');
        return;
      }

      const { error: addError } = await supabase
        .from('friends')
        .insert([{
          user_id: user.id,
          friend_id: postUserId,
        }]);

      if (addError) throw addError;

      // Update the post's friend status in the UI
      setPosts(prev => prev.map(post => {
        if (post.user_id === postUserId) {
          return {
            ...post,
            friend_status: 'pending',
            is_friend_request_sender: true
          };
        }
        return post;
      }));

    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(`Failed to send friend request to ${username}. Please try again.`);
    } finally {
      setSendingFriendRequest(null);
    }
  };

  const handleAcceptFriend = async (postUserId: string, username: string) => {
    if (!user) return;
    
    try {
      setSendingFriendRequest(postUserId);
      setError(null);

      const { error: updateError } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .match({ friend_id: user.id, user_id: postUserId });

      if (updateError) throw updateError;

      // Update the post's friend status in the UI
      setPosts(prev => prev.map(post => {
        if (post.user_id === postUserId) {
          return {
            ...post,
            friend_status: 'accepted'
          };
        }
        return post;
      }));

    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError(`Failed to accept friend request from ${username}. Please try again.`);
    } finally {
      setSendingFriendRequest(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-[#0F1E0F]">Explore</h1>
          <button
            onClick={() => setIsCreatePostModalOpen(true)}
            className="bg-[#319141] text-white px-4 py-2 rounded-xl hover:bg-[#0F1E0F] transition-colors flex items-center justify-center gap-2 sm:ml-auto"
          >
            <FaPlus className="text-sm" /> Create Post
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-white rounded-xl shadow-sm p-2">
          <button
            onClick={() => setViewMode('explore')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
              viewMode === 'explore'
                ? 'bg-[#319141] text-white'
                : 'text-[#0F1E0F] hover:bg-gray-50'
            }`}
          >
            <FaGlobe className="text-sm" />
            <span>Explore</span>
          </button>
          <button
            onClick={() => setViewMode('trending')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
              viewMode === 'trending'
                ? 'bg-[#319141] text-white'
                : 'text-[#0F1E0F] hover:bg-gray-50'
            }`}
          >
            <FaChartLine className="text-sm" />
            <span>Trending</span>
          </button>
          <button
            onClick={() => setViewMode('my-posts')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
              viewMode === 'my-posts'
                ? 'bg-[#319141] text-white'
                : 'text-[#0F1E0F] hover:bg-gray-50'
            }`}
          >
            <FaUser className="text-sm" />
            <span>My Posts</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-500 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <FaSpinner className="animate-spin text-[#319141] text-2xl" />
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
          <button
            onClick={() => setIsCreatePostModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#319141] text-white rounded-lg hover:bg-[#0F1E0F] transition-colors"
          >
            <FaPlus /> Create Post
          </button>
        </div>
      ) : (
        <div className="grid gap-6 mt-8">
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
                <div className="flex flex-col gap-3">
                  {/* User Info Row */}
                  <div className="flex items-start justify-between gap-3">
                    <Link 
                      href={`/profile/${post.username}`}
                      className="flex items-start gap-3 hover:opacity-80 transition-opacity min-w-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex-shrink-0 flex items-center justify-center">
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
                      <div className="min-w-0">
                        <p className="font-medium text-primary hover:text-[#2B5C40] transition-colors truncate">
                          {post.display_name || post.username}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span className="text-text-secondary truncate">@{post.username}</span>
                          {post.friend_status === 'accepted' && (
                            <span className="text-accent flex items-center gap-1 whitespace-nowrap">
                              <FaCheck className="text-xs" /> Friends
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      {user && post.user_id === user.id && (
                        <div className="relative">
                          <button
                            onClick={() => setDeleteConfirm(deleteConfirm === post.id ? null : post.id)}
                            className="text-text-secondary hover:text-primary transition-colors p-1"
                          >
                            <FaEllipsisV />
                          </button>
                          {deleteConfirm === post.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                              >
                                <FaTrash className="text-xs" />
                                Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-sm text-text-secondary whitespace-nowrap">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Friend Request Button Row */}
                  {user && post.user_id !== user.id && post.friend_status !== 'accepted' && (
                    <div className="flex items-center gap-2">
                      {post.friend_status === 'pending' ? (
                        post.is_friend_request_sender ? (
                          <span className="text-sm text-text-secondary">Request sent</span>
                        ) : (
                          <button
                            onClick={() => handleAcceptFriend(post.user_id, post.username)}
                            disabled={sendingFriendRequest === post.user_id}
                            className="text-sm bg-accent text-white px-3 py-1 rounded-md hover:bg-accent/90 transition-colors flex items-center gap-1"
                          >
                            {sendingFriendRequest === post.user_id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaCheck className="text-xs" /> Accept
                              </>
                            )}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleFriendRequest(post.user_id, post.username)}
                          disabled={sendingFriendRequest === post.user_id}
                          className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-md hover:bg-accent/20 transition-colors flex items-center gap-1"
                        >
                          {sendingFriendRequest === post.user_id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <>
                              <FaUserPlus className="text-xs" /> Add Friend
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
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
                    <div className="space-y-2">
                      {(() => {
                        try {
                          // First try to parse as JSON array
                          let steps: string[] = [];
                          
                          if (Array.isArray(post.food_recipe)) {
                            steps = post.food_recipe;
                          } else if (typeof post.food_recipe === 'string') {
                            if (post.food_recipe.startsWith('[') && post.food_recipe.endsWith(']')) {
                              steps = JSON.parse(post.food_recipe);
                            } else {
                              // Split by newlines or periods
                              steps = post.food_recipe
                                .split(/(?:\r?\n|\.(?=\s|$))/)
                                .map(step => step.trim())
                                .filter(step => step.length > 0);
                            }
                          }

                          return steps.map((step, idx) => {
                            // Clean the step text
                            let cleanedStep = step;
                            if (typeof cleanedStep === 'string') {
                              // Remove quotes if present
                              if (cleanedStep.startsWith('"') && cleanedStep.endsWith('"')) {
                                cleanedStep = cleanedStep.substring(1, cleanedStep.length - 1);
                              }
                              // Remove brackets if present
                              cleanedStep = cleanedStep.replace(/^\[|\]$/g, '');
                              // Remove backslashes
                              cleanedStep = cleanedStep.replace(/\\/g, '');
                              // Trim whitespace
                              cleanedStep = cleanedStep.trim();
                            }
                            
                            return (
                              <div key={idx} className="flex gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm">
                                  {idx + 1}
                                </span>
                                <p className="text-text-secondary text-sm">{cleanedStep}</p>
                              </div>
                            );
                          });
                        } catch (error) {
                          console.error('Error parsing recipe:', error);
                          return <p className="text-text-secondary text-sm">Recipe format not supported</p>;
                        }
                      })()}
                    </div>
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