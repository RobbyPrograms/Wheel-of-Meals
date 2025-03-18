'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FavoriteFood, UserProfile } from '@/lib/supabase';
import { FaSpinner, FaHeart, FaComment, FaShare, FaUserPlus } from 'react-icons/fa';
import Link from 'next/link';

type Post = {
  id: string;
  user_id: string;
  food_id: string;
  created_at: string;
  user_info: UserProfile;
  food: FavoriteFood;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
};

export default function ExplorePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_explore_posts', { p_user_id: user?.id });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase
        .rpc('search_users', { search_query: query });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { error } = await supabase
        .rpc('toggle_post_like', { p_post_id: postId, p_user_id: user?.id });

      if (error) throw error;
      fetchPosts(); // Refresh posts to update likes
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to like post. Please try again.');
    }
  };

  const addFriend = async (friendId: string) => {
    try {
      setAddingFriend(friendId);
      const { error } = await supabase
        .from('friends')
        .insert([{ user_id: user?.id, friend_id: friendId }]);

      if (error) throw error;
      setSearchResults(searchResults.filter(result => result.id !== friendId));
    } catch (err) {
      console.error('Error adding friend:', err);
      setError('Failed to add friend. Please try again.');
    } finally {
      setAddingFriend(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Please sign in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">Find Friends</h2>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or display name"
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {searching && (
              <FaSpinner className="animate-spin absolute right-3 top-3 text-gray-400" />
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 bg-white rounded-lg shadow-sm flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">@{result.username}</span>
                    {result.display_name && (
                      <span className="text-text-secondary ml-2">({result.display_name})</span>
                    )}
                  </div>
                  <button
                    onClick={() => addFriend(result.id)}
                    disabled={addingFriend === result.id}
                    className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {addingFriend === result.id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaUserPlus />
                        Add Friend
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length > 0 && searchResults.length === 0 && !searching && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-text-secondary">
              No users found. Try a different search term.
            </div>
          )}
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Explore Meals</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <FaSpinner className="animate-spin text-2xl text-accent" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No meals to explore yet. Add some friends to see their meals!
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4">
                  <Link href={`/dashboard/profile/${post.user_info.username}`} className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {post.user_info.avatar_url ? (
                        <img
                          src={post.user_info.avatar_url}
                          alt={post.user_info.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {post.user_info.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">@{post.user_info.username}</span>
                      {post.user_info.display_name && (
                        <span className="text-text-secondary ml-2">({post.user_info.display_name})</span>
                      )}
                    </div>
                  </Link>

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-primary mb-2">{post.food.name}</h3>
                    {post.food.description && (
                      <p className="text-text-secondary mb-2">{post.food.description}</p>
                    )}
                    <div className="mt-2">
                      <h4 className="font-medium text-primary mb-1">Ingredients:</h4>
                      <ul className="list-disc list-inside text-text-secondary">
                        {post.food.ingredients.map((ingredient, index) => (
                          <li key={index}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                    {post.food.recipe && (
                      <div className="mt-2">
                        <h4 className="font-medium text-primary mb-1">Recipe:</h4>
                        <p className="text-text-secondary whitespace-pre-wrap">{post.food.recipe}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 ${
                        post.is_liked ? 'text-red-500' : 'text-text-secondary'
                      }`}
                    >
                      <FaHeart />
                      <span>{post.likes_count}</span>
                    </button>
                    <button className="flex items-center gap-1 text-text-secondary">
                      <FaComment />
                      <span>{post.comments_count}</span>
                    </button>
                    <button className="flex items-center gap-1 text-text-secondary">
                      <FaShare />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 