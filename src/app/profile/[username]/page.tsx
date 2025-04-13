'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { FaSpinner, FaPlus, FaCheck, FaFilter, FaUserPlus } from 'react-icons/fa';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  friend_status?: 'pending' | 'accepted' | null;
  is_friend_request_sender?: boolean;
}

interface FavoriteFood {
  id: string;
  name: string;
  ingredients: string[];
  recipe: string;
  user_id: string;
  meal_types: string[];
  visibility: 'public' | 'private';
}

export default function UserProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedFoods, setAddedFoods] = useState<Set<string>>(new Set());
  const [addingFood, setAddingFood] = useState<string | null>(null);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const mealTypeOptions = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found');

      // If logged in, get friend status
      if (user && user.id !== profileData.id) {
        const { data: friendData, error: friendError } = await supabase
          .from('friends')
          .select('*')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profileData.id}),and(user_id.eq.${profileData.id},friend_id.eq.${user.id})`)
          .single();

        if (friendError && !friendError.message.includes('No rows found')) {
          throw friendError;
        }

        if (friendData) {
          profileData.friend_status = friendData.status;
          profileData.is_friend_request_sender = friendData.user_id === user.id;
        }
      }

      setProfile(profileData);

      // Get favorite foods
      const { data: foodsData, error: foodsError } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', profileData.id);

      if (foodsError) throw foodsError;
      setFavoriteFoods(foodsData || []);

      // If logged in, check which foods the user has already added
      if (user) {
        const { data: userFoods } = await supabase
          .from('favorite_foods')
          .select('name')
          .eq('user_id', user.id);
        
        if (userFoods) {
          setAddedFoods(new Set(userFoods.map(f => f.name)));
        }
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToMyFoods = async (food: FavoriteFood) => {
    if (!user) return;

    try {
      setAddingFood(food.id);
      const { error: addError } = await supabase
        .from('favorite_foods')
        .insert([{
          name: food.name,
          ingredients: food.ingredients,
          recipe: food.recipe,
          user_id: user.id,
        }]);

      if (addError) throw addError;

      setAddedFoods(prev => new Set([...Array.from(prev), food.name]));
      setError(null);
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food to your favorites. Please try again.');
    } finally {
      setAddingFood(null);
    }
  };

  const handleFriendRequest = async () => {
    if (!user || !profile) return;
    
    try {
      setSendingFriendRequest(true);
      setError(null);

      // Check if friend request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${user.id})`);

      if (checkError) throw checkError;

      if (existingRequest && existingRequest.length > 0) {
        setError('Friend request already exists.');
        return;
      }

      const { error: addError } = await supabase
        .from('friends')
        .insert([{
          user_id: user.id,
          friend_id: profile.id,
        }]);

      if (addError) throw addError;

      // Update the profile's friend status in the UI
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          friend_status: 'pending',
          is_friend_request_sender: true
        };
      });

    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(`Failed to send friend request to ${profile.username}. Please try again.`);
    } finally {
      setSendingFriendRequest(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!user || !profile) return;
    
    try {
      setSendingFriendRequest(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .match({ friend_id: user.id, user_id: profile.id });

      if (updateError) throw updateError;

      // Update the profile's friend status in the UI
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          friend_status: 'accepted'
        };
      });

    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError(`Failed to accept friend request from ${profile.username}. Please try again.`);
    } finally {
      setSendingFriendRequest(false);
    }
  };

  const filteredFoods = favoriteFoods.filter(food => 
    selectedMealTypes.length === 0 || 
    food.meal_types.some(type => selectedMealTypes.includes(type))
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <FaSpinner className="animate-spin text-3xl text-accent mx-auto mb-4" />
            <p className="text-text-secondary">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Profile not found'}</p>
            <Link href="/dashboard" className="text-accent hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-accent">
                      {profile.display_name?.[0] || profile.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-text-secondary">@{profile.username}</p>
                </div>
              </div>

              {/* Friend Status/Actions */}
              {user && user.id !== profile.id && (
                <div className="flex items-center gap-2">
                  {profile.friend_status === 'accepted' ? (
                    <span className="text-sm text-accent flex items-center gap-1">
                      <FaCheck className="text-xs" /> Friends
                    </span>
                  ) : profile.friend_status === 'pending' ? (
                    profile.is_friend_request_sender ? (
                      <span className="text-sm text-text-secondary">Request sent</span>
                    ) : (
                      <button
                        onClick={handleAcceptFriend}
                        disabled={sendingFriendRequest}
                        className="text-sm bg-accent text-white px-3 py-1 rounded-md hover:bg-accent/90 transition-colors flex items-center gap-1"
                      >
                        {sendingFriendRequest ? (
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
                      onClick={handleFriendRequest}
                      disabled={sendingFriendRequest}
                      className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-md hover:bg-accent/20 transition-colors flex items-center gap-1"
                    >
                      {sendingFriendRequest ? (
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

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-primary">Favorite Meals</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    <FaFilter className="text-sm" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Meal Type Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {mealTypeOptions.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    if (selectedMealTypes.includes(type)) {
                      setSelectedMealTypes(prev => prev.filter(t => t !== type));
                    } else {
                      setSelectedMealTypes(prev => [...prev, type]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedMealTypes.includes(type)
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
              {selectedMealTypes.length > 0 && (
                <button
                  onClick={() => setSelectedMealTypes([])}
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-accent transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {filteredFoods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">
                  {favoriteFoods.length === 0
                    ? "No favorite meals yet."
                    : "No meals match the selected filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFoods.map((food) => (
                  <div 
                    key={food.id} 
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-2">{food.name}</h3>
                          <div className="flex flex-wrap gap-2">
                            {food.meal_types.map(type => (
                              <span
                                key={type}
                                className="px-2 py-1 bg-accent/10 text-accent rounded-md text-xs font-medium"
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            ))}
                          </div>
                        </div>
                        {user && user.id !== profile.id && (
                          <button
                            onClick={() => addToMyFoods(food)}
                            disabled={addingFood === food.id || addedFoods.has(food.name)}
                            className={`p-2 rounded-full transition-colors ${
                              addedFoods.has(food.name)
                                ? 'text-green-500 bg-green-50'
                                : 'text-accent hover:bg-accent/10'
                            }`}
                            title={addedFoods.has(food.name) ? "Added to your meals" : "Add to your meals"}
                          >
                            {addingFood === food.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : addedFoods.has(food.name) ? (
                              <FaCheck />
                            ) : (
                              <FaPlus />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Ingredients</h4>
                          <div className="flex flex-wrap gap-2">
                            {food.ingredients.map((ingredient, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm"
                              >
                                {ingredient}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Recipe</h4>
                          <p className="text-gray-600 text-sm whitespace-pre-wrap">{food.recipe}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 