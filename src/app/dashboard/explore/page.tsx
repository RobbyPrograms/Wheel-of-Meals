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
import ImageUpload from '@/components/ImageUpload';
import Image from 'next/image';

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
  image_url?: string | null;
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
      const { data: postData, error: postError } = await supabase
        .rpc('create_post', {
          p_food_id: selectedFoodId,
          p_caption: caption || null,
          p_is_explore: true,
          p_image_url: imageUrl
        });

      if (postError) {
        console.error('Post creation error:', postError);
        throw new Error(postError.message || 'Failed to create post');
      }

      if (!postData) {
        throw new Error('No post data returned');
      }

      const transformedPost: Post = {
        id: postData.id,
        user_id: postData.user_id,
        food_id: postData.food_id,
        caption: postData.caption,
        created_at: postData.created_at,
        is_explore: postData.is_explore,
        food_name: postData.food_name,
        food_ingredients: postData.food_ingredients || [],
        food_recipe: postData.food_recipe,
        food_meal_types: postData.food_meal_types || [],
        food_visibility: postData.food_visibility,
        username: postData.username,
        display_name: postData.display_name,
        avatar_url: postData.avatar_url,
        likes_count: postData.likes_count || 0,
        reposts_count: postData.reposts_count || 0,
        is_liked: postData.is_liked || false,
        is_reposted: postData.is_reposted || false,
        reposted_by_username: null,
        reposted_by_display_name: null,
        repost_created_at: null,
        friend_status: null,
        is_friend_request_sender: false,
        image_url: imageUrl
      };

      onPostCreated(transformedPost);
      onClose();
      await onRefresh();
    } catch (err: unknown) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post. Please try again.');
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  const handleImageClear = () => {
    setImageUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mt-[5vh] mb-4 max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-2xl font-semibold text-[#0F1E0F]">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#0F1E0F] transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content & Footer inside form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 overflow-y-auto p-6 flex-1">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
              <FaTimes className="flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Meal Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0F1E0F]">
              Select a Meal to Share
            </h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <FaSpinner className="animate-spin text-[#319141] text-2xl" />
              </div>
            ) : userFoods.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <FaUtensils className="mx-auto text-4xl text-gray-300 mb-4" />
                <p className="text-gray-600 mb-6">
                  You haven't added any meals yet.
                </p>
                <Link
                  href="/dashboard/foods"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#319141] text-white rounded-xl hover:bg-[#0F1E0F] transition-colors"
                >
                  <FaPlus className="text-sm" />
                  Add Your First Meal
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => setSelectedFoodId(food.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      selectedFoodId === food.id
                        ? 'border-[#319141] bg-[#319141]/5'
                        : 'border-gray-100 hover:border-[#319141]/30'
                    }`}
                  >
                    <h3 className="font-semibold text-[#0F1E0F] mb-2">{food.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <FaUtensils className="text-[#319141]" />
                        {food.meal_types?.[0] || 'Any meal'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0F1E0F]">
              Add a Photo
            </h3>
            <ImageUpload
              onUpload={handleImageUpload}
              onClear={handleImageClear}
              url={imageUrl}
            />
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#0F1E0F]">
              Add a Caption
            </h3>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your thoughts about this meal..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#319141] focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Live Preview */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-[#0F1E0F] mb-4">Post Preview</h3>
            <div className="bg-gray-50 rounded-xl shadow p-6 flex flex-col gap-4">
              {/* Image Preview */}
              {imageUrl && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={imageUrl} alt="Preview" className="object-cover w-full h-full" />
                </div>
              )}
              {/* Meal Name */}
              <div className="flex items-center gap-2">
                <FaUtensils className="text-[#319141]" />
                <span className="font-semibold text-[#0F1E0F]">
                  {userFoods.find(f => f.id === selectedFoodId)?.name || 'Select a meal'}
                </span>
              </div>
              {/* Caption Preview */}
              {caption && (
                <div className="text-gray-700 italic border-l-4 border-[#319141] pl-4">{caption}</div>
              )}
            </div>
          </div>

          {/* Footer Buttons inside form */}
          <div className="pt-6 border-t border-gray-100 flex justify-end gap-4 bg-white rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-[#0F1E0F] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFoodId || loading}
              className="px-8 py-3 bg-[#319141] text-white rounded-xl hover:bg-[#0F1E0F] transition-colors disabled:opacity-50 disabled:hover:bg-[#319141] font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FaPlus className="text-sm" />
                  Create Post
                </>
              )}
            </button>
          </div>
        </form>
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

      
      // Get posts with detailed error logging
      const { data: postsData, error: rpcError } = await supabase.rpc(
        functionName, 
        functionName === 'get_user_posts' ? { p_user_id: user.id } : {}
      );
      
      if (rpcError) {
        console.error('Supabase RPC error details:', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code,
          functionName
        });
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

      if (error) {
        console.error('Error in toggle_post_repost:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from toggle_post_repost');
      }

      const { is_reposted, reposts_count } = data[0];
      
      // Update the local state immediately
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_reposted,
            reposts_count
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
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-gray-50 pb-4">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm">
            <h1 className="text-3xl font-bold text-[#0F1E0F]">Explore</h1>
            <button
              onClick={() => setIsCreatePostModalOpen(true)}
              className="bg-[#319141] text-white px-6 py-3 rounded-xl hover:bg-[#0F1E0F] transition-colors flex items-center justify-center gap-2 sm:ml-auto text-lg font-medium"
            >
              <FaPlus className="text-sm" /> Create Post
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-3 bg-white rounded-2xl shadow-sm p-3 mt-4">
            <button
              onClick={() => setViewMode('explore')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-medium transition-colors ${
                viewMode === 'explore'
                  ? 'bg-[#319141] text-white'
                  : 'text-[#0F1E0F] hover:bg-gray-50'
              }`}
            >
              <FaGlobe className="text-lg" />
              <span>Explore</span>
            </button>
            <button
              onClick={() => setViewMode('trending')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-medium transition-colors ${
                viewMode === 'trending'
                  ? 'bg-[#319141] text-white'
                  : 'text-[#0F1E0F] hover:bg-gray-50'
              }`}
            >
              <FaChartLine className="text-lg" />
              <span>Trending</span>
            </button>
            <button
              onClick={() => setViewMode('my-posts')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-medium transition-colors ${
                viewMode === 'my-posts'
                  ? 'bg-[#319141] text-white'
                  : 'text-[#0F1E0F] hover:bg-gray-50'
              }`}
            >
              <FaUser className="text-lg" />
              <span>My Posts</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col gap-6">
          {error && (
            <div className="mt-6 p-6 bg-red-50 text-red-500 rounded-2xl text-lg flex items-center gap-3">
              <FaTimes className="flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <FaSpinner className="animate-spin text-[#319141] text-3xl" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl mt-6 shadow-sm">
              <FaUtensils className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg mb-6">
                {viewMode === 'explore' 
                  ? 'No posts yet. Be the first to share!'
                  : viewMode === 'trending'
                  ? 'No trending posts yet. Check back later for new posts!'
                  : 'You haven\'t created any posts yet.'}
              </p>
              <button
                onClick={() => setIsCreatePostModalOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#319141] text-white rounded-xl hover:bg-[#0F1E0F] transition-colors text-lg font-medium"
              >
                <FaPlus /> Create Post
              </button>
            </div>
          ) : (
            <div className="grid gap-8 mt-6">
              {posts.map((post) => (
                <div 
                  key={post.reposted_by_username 
                    ? `repost-${post.id}-${post.reposted_by_username}-${post.repost_created_at}` 
                    : post.id
                  } 
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Repost Info */}
                  {post.reposted_by_username && (
                    <div className="px-8 pt-6 flex items-center gap-2 text-base text-gray-600">
                      <FaRetweet className="text-green-500" />
                      <span>
                        {post.reposted_by_display_name || post.reposted_by_username} reposted
                      </span>
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="p-8">
                    {/* Post Image */}
                    {post.image_url && (
                      <div className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden">
                        <Image
                          src={post.image_url}
                          alt={post.food_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-6">
                      <Link 
                        href={`/profile/${post.username}`}
                        className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {post.avatar_url ? (
                            <Image
                              src={post.avatar_url}
                              alt={post.username}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          ) : (
                            <FaUserCircle className="text-3xl text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-lg text-[#0F1E0F]">
                            {post.display_name || post.username}
                          </div>
                          <div className="text-base text-gray-600">
                            @{post.username}
                          </div>
                        </div>
                      </Link>

                      {user && post.user_id === user.id && (
                        <div className="relative">
                          <button
                            onClick={() => setDeleteConfirm(deleteConfirm === post.id ? null : post.id)}
                            className="text-gray-600 hover:text-[#0F1E0F] transition-colors p-2"
                          >
                            <FaEllipsisV />
                          </button>
                          {deleteConfirm === post.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-10">
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="w-full text-left px-6 py-3 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                              >
                                <FaTrash className="text-sm" />
                                Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Friend Request Button Row */}
                    {user && post.user_id !== user.id && post.friend_status !== 'accepted' && (
                      <div className="flex items-center gap-2 mb-6">
                        {post.friend_status === 'pending' ? (
                          post.is_friend_request_sender ? (
                            <span className="text-base text-gray-600">Request sent</span>
                          ) : (
                            <button
                              onClick={() => handleAcceptFriend(post.user_id, post.username)}
                              disabled={sendingFriendRequest === post.user_id}
                              className="text-base bg-[#319141] text-white px-6 py-2 rounded-xl hover:bg-[#0F1E0F] transition-colors flex items-center gap-2 font-medium"
                            >
                              {sendingFriendRequest === post.user_id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <>
                                  <FaCheck className="text-sm" /> Accept
                                </>
                              )}
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleFriendRequest(post.user_id, post.username)}
                            disabled={sendingFriendRequest === post.user_id}
                            className="text-base bg-[#319141]/10 text-[#319141] px-6 py-2 rounded-xl hover:bg-[#319141]/20 transition-colors flex items-center gap-2 font-medium"
                          >
                            {sendingFriendRequest === post.user_id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaUserPlus className="text-sm" /> Add Friend
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Meal Content */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-[#0F1E0F]">{post.food_name}</h2>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-2 text-base text-gray-600">
                            <FaUtensils className="text-[#319141]" />
                            {Array.isArray(post.food_meal_types) && post.food_meal_types.length > 0
                              ? post.food_meal_types[0]
                              : 'Any meal'}
                          </span>
                        </div>
                      </div>

                      {post.caption && (
                        <p className="text-gray-600 text-lg italic">"{post.caption}"</p>
                      )}

                      {/* Ingredients */}
                      <div>
                        <h3 className="font-medium text-lg text-[#0F1E0F] mb-3">Ingredients</h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(post.food_ingredients) ? (
                            post.food_ingredients.map((ingredient, idx) => (
                              <span
                                key={idx}
                                className="px-4 py-2 bg-[#319141]/5 text-[#319141] rounded-xl text-base"
                              >
                                {ingredient}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-600 text-base">No ingredients listed</span>
                          )}
                        </div>
                      </div>

                      {/* Recipe */}
                      {post.food_recipe && (
                        <div>
                          <h3 className="font-medium text-lg text-[#0F1E0F] mb-3">Recipe</h3>
                          <div className="space-y-4">
                            {(() => {
                              try {
                                let steps: string[] = [];
                                
                                if (Array.isArray(post.food_recipe)) {
                                  steps = post.food_recipe;
                                } else if (typeof post.food_recipe === 'string') {
                                  if (post.food_recipe.startsWith('[') && post.food_recipe.endsWith(']')) {
                                    steps = JSON.parse(post.food_recipe);
                                  } else {
                                    steps = post.food_recipe
                                      .split(/(?:\r?\n|\.(?=\s|$))/)
                                      .map(step => step.trim())
                                      .filter(step => step.length > 0);
                                  }
                                }

                                return steps.map((step, idx) => {
                                  let cleanedStep = step;
                                  if (typeof cleanedStep === 'string') {
                                    if (cleanedStep.startsWith('"') && cleanedStep.endsWith('"')) {
                                      cleanedStep = cleanedStep.substring(1, cleanedStep.length - 1);
                                    }
                                    cleanedStep = cleanedStep.replace(/^\[|\]$/g, '');
                                    cleanedStep = cleanedStep.replace(/\\/g, '');
                                    cleanedStep = cleanedStep.trim();
                                  }
                                  
                                  return (
                                    <div key={idx} className="flex gap-3">
                                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#319141]/10 text-[#319141] flex items-center justify-center text-base font-medium">
                                        {idx + 1}
                                      </span>
                                      <p className="text-gray-600 text-base leading-relaxed pt-1">{cleanedStep}</p>
                                    </div>
                                  );
                                });
                              } catch (error) {
                                console.error('Error parsing recipe:', error);
                                return <p className="text-gray-600 text-base">Recipe format not supported</p>;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Actions */}
                  <div className="px-8 py-6 border-t border-gray-100 flex items-center gap-8">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-3 text-base transition-colors ${
                        post.is_liked
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      {post.is_liked ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
                      <span className="font-medium">{post.likes_count || ''}</span>
                    </button>

                    <button
                      onClick={() => handleRepostPost(post.id)}
                      className={`flex items-center gap-3 text-base transition-colors ${
                        post.is_reposted
                          ? 'text-green-500 hover:text-green-600'
                          : 'text-gray-600 hover:text-green-500'
                      }`}
                    >
                      <FaRetweet className="text-xl" />
                      <span className="font-medium">{post.reposts_count || ''}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          onPostCreated={handlePostCreated}
          onRefresh={fetchPosts}
        />
      </div>
    </div>
  );
} 