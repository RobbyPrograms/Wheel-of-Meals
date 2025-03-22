'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { FavoriteFood } from '@/lib/supabase';
import Link from 'next/link';
import { FaUserPlus, FaCheck, FaTimes, FaSpinner, FaPlus } from 'react-icons/fa';

type Friend = {
  friend_id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  is_sender: boolean;
};

type UserProfile = {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
};

type FriendMeals = {
  [key: string]: FavoriteFood[];
};

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendMeals, setFriendMeals] = useState<Record<string, FavoriteFood[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [updatingFriend, setUpdatingFriend] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_friends', { p_user_id: user?.id });

      if (fetchError) throw fetchError;

      setFriends(data || []);
      
      // Fetch meals for each friend
      const meals: FriendMeals = {};
      for (const friend of data || []) {
        const { data: friendMeals } = await supabase
          .from('favorite_foods')
          .select('*')
          .eq('user_id', friend.friend_id);
        
        if (friendMeals) {
          meals[friend.friend_id] = friendMeals;
        }
      }
      setFriendMeals(meals);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setError(null);

      const { data, error: searchError } = await supabase
        .rpc('search_users', { 
          search_query: query,
          current_user_id: user?.id
        });

      if (searchError) throw searchError;

      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUser(searchEmail);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchEmail]);

  const addFriend = async () => {
    if (!searchResult || !user) return;

    try {
      setAddingFriend(true);
      setError(null);

      const { error: addError } = await supabase
        .from('friends')
        .insert([{
          user_id: user.id,
          friend_id: searchResult.id,
        }]);

      if (addError) throw addError;

      setSearchEmail('');
      setSearchResult(null);
      await fetchFriends();
    } catch (err) {
      console.error('Error adding friend:', err);
      setError('Failed to add friend. Please try again.');
    } finally {
      setAddingFriend(false);
    }
  };

  const addToMyFoods = async (food: FavoriteFood) => {
    if (!user) return;

    try {
      const { error: addError } = await supabase
        .from('favorite_foods')
        .insert([{
          ...food,
          id: undefined, // Let Supabase generate a new ID
          user_id: user.id,
          created_at: new Date().toISOString(),
        }]);

      if (addError) throw addError;

      setError(null);
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food to your favorites. Please try again.');
    }
  };

  const handleFriendRequest = async (friendId: string, status: 'accepted' | 'rejected') => {
    if (!user) return;

    try {
      setUpdatingFriend(friendId);
      setError(null);

      const { error: updateError } = await supabase
        .from('friends')
        .update({ status })
        .match({ friend_id: user.id, user_id: friendId });

      if (updateError) throw updateError;

      await fetchFriends();
    } catch (err) {
      console.error('Error updating friend request:', err);
      setError('Failed to update friend request. Please try again.');
    } finally {
      setUpdatingFriend(null);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Friends</h1>
          <p className="text-text-secondary mb-6">Please log in to use this feature.</p>
          <Link
            href="/login"
            className="inline-block bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Friends</h1>
        <p className="text-text-secondary">
          Connect with friends and discover their favorite meals!
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-500">
          {error}
        </div>
      )}

      {/* Add Friend Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary mb-4">Find Friends</h2>
        <div className="relative">
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
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
                className="p-4 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="font-medium">{result.username}</span>
                  {result.display_name && (
                    <span className="text-text-secondary ml-2">({result.display_name})</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchResult(result);
                    addFriend();
                  }}
                  disabled={addingFriend}
                  className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {addingFriend ? (
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

        {searchEmail.length > 0 && searchResults.length === 0 && !searching && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-text-secondary">
            No users found. Try a different search term.
          </div>
        )}
      </div>

      {/* Friends List */}
      {loading ? (
        <div className="text-center py-8">
          <FaSpinner className="animate-spin text-3xl text-accent mx-auto mb-4" />
          <p className="text-text-secondary">Loading friends...</p>
        </div>
      ) : (
        <>
          {/* Pending Friend Requests */}
          {friends.filter(f => f.status === 'pending' && !f.is_sender).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">Friend Requests</h2>
              <div className="space-y-4">
                {friends
                  .filter(f => f.status === 'pending' && !f.is_sender)
                  .map((friend) => (
                    <div key={friend.friend_id} className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-primary">
                            {friend.display_name || friend.username}
                          </h3>
                          <p className="text-sm text-text-secondary">@{friend.username}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFriendRequest(friend.friend_id, 'accepted')}
                            disabled={updatingFriend === friend.friend_id}
                            className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {updatingFriend === friend.friend_id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaCheck />
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleFriendRequest(friend.friend_id, 'rejected')}
                            disabled={updatingFriend === friend.friend_id}
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {updatingFriend === friend.friend_id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <>
                                <FaTimes />
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sent Friend Requests */}
          {friends.filter(f => f.status === 'pending' && f.is_sender).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">Sent Requests</h2>
              <div className="space-y-4">
                {friends
                  .filter(f => f.status === 'pending' && f.is_sender)
                  .map((friend) => (
                    <div key={friend.friend_id} className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-primary">
                            {friend.display_name || friend.username}
                          </h3>
                          <p className="text-sm text-text-secondary">@{friend.username}</p>
                        </div>
                        <span className="text-text-secondary">Pending response</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Accepted Friends */}
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-primary mb-4">Friends</h2>
            {friends
              .filter(f => f.status === 'accepted')
              .map((friend) => (
                <div key={friend.friend_id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        {friend.display_name || friend.username}
                      </h3>
                      <p className="text-sm text-text-secondary">@{friend.username}</p>
                    </div>
                  </div>

                  {/* Friend's Meals */}
                  <div>
                    <h4 className="font-medium text-primary mb-2">Favorite Meals</h4>
                    {friendMeals[friend.friend_id]?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friendMeals[friend.friend_id].map((meal) => (
                          <div
                            key={meal.id}
                            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-primary">{meal.name}</h5>
                                <p className="text-sm text-text-secondary">
                                  {Array.isArray(meal.ingredients) 
                                    ? meal.ingredients.join(', ')
                                    : 'No ingredients listed'}
                                </p>
                              </div>
                              <button
                                onClick={() => addToMyFoods(meal)}
                                className="text-accent hover:text-accent/80 transition-colors"
                                title="Add to My Foods"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-secondary">No favorite meals yet.</p>
                    )}
                  </div>
                </div>
              ))}

            {friends.filter(f => f.status === 'accepted').length === 0 && (
              <div className="text-center py-8 bg-white rounded-xl shadow-md">
                <p className="text-text-secondary mb-4">No accepted friends yet.</p>
                <p className="text-sm text-text-secondary">
                  Search for friends by their username to connect!
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 