'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { FaSpinner, FaPlus, FaCheck, FaFilter, FaUserPlus, FaArrowLeft } from 'react-icons/fa';
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
  }, [username, user]);

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

      // Get friend statuses exactly like explore page
      if (user && user.id !== profileData.id) {
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (friendsError) {
          console.error('Error fetching friend statuses:', friendsError);
        } else {
          // Find friend status for this profile
          const friendRelation = friendsData?.find(f => 
            (f.user_id === user.id && f.friend_id === profileData.id) ||
            (f.friend_id === user.id && f.user_id === profileData.id)
          );

          profileData.friend_status = friendRelation?.status || null;
          profileData.is_friend_request_sender = friendRelation ? friendRelation.user_id === user.id : false;
        }
      }

      setProfile(profileData);

      // Get favorite foods
      const { data: foodsData, error: foodsError } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('visibility', 'public');

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
          meal_types: food.meal_types,
          visibility: 'private' // Default to private when adding someone else's food
        }]);

      if (addError) throw addError;

      // Update the local state to show the "Added" state
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
          status: 'pending'
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
      setError('Failed to send friend request. Please try again.');
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
      setError('Failed to accept friend request. Please try again.');
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
            <Link 
              href="/dashboard/explore" 
              className="text-[#319141] hover:text-[#0F1E0F] transition-colors flex items-center gap-2"
            >
              <FaArrowLeft />
              Back to Explore
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
              href="/dashboard/explore" 
              className="text-[#319141] hover:text-[#0F1E0F] transition-colors flex items-center gap-2"
            >
              <FaArrowLeft />
              Back to Explore
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl text-accent">
                      {profile.display_name?.[0] || profile.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-text-secondary">@{profile.username}</p>
                </div>
              </div>

              {/* Friend Status/Actions */}
              {user && user.id !== profile.id && (
                <div className="flex justify-center sm:justify-start items-center gap-2">
                  {profile.friend_status === 'accepted' ? (
                    <span className="text-sm text-accent flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-full">
                      <FaCheck className="text-xs" /> Friends
                    </span>
                  ) : profile.friend_status === 'pending' ? (
                    profile.is_friend_request_sender ? (
                      <span className="text-sm text-text-secondary bg-gray-100 px-3 py-1.5 rounded-full">Request sent</span>
                    ) : (
                      <button
                        onClick={handleAcceptFriend}
                        disabled={sendingFriendRequest}
                        className="text-sm bg-accent text-white px-4 py-1.5 rounded-full hover:bg-accent/90 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center"
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
                      className="text-sm bg-accent/10 text-accent px-4 py-1.5 rounded-full hover:bg-accent/20 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center"
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

          {/* Filter Section */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-primary">Favorite Meals</h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedMealTypes([])}
                  className={`text-sm px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                    selectedMealTypes.length === 0
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  <FaFilter className="text-xs" /> All
                </button>
                {mealTypeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (selectedMealTypes.includes(type)) {
                        setSelectedMealTypes(prev => prev.filter(t => t !== type));
                      } else {
                        setSelectedMealTypes(prev => [...prev, type]);
                      }
                    }}
                    className={`text-sm px-3 py-1.5 rounded-full transition-colors capitalize ${
                      selectedMealTypes.includes(type)
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Meals Grid */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            {filteredFoods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">
                  {favoriteFoods.length === 0
                    ? "No favorite meals yet."
                    : "No meals match the selected filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {filteredFoods.map((food) => (
                  <div 
                    key={food.id} 
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-2">{food.name}</h3>
                          <div className="flex flex-wrap gap-2">
                            {food.meal_types.map(type => (
                              <span
                                key={type}
                                className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium"
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            ))}
                          </div>
                        </div>
                        {user && user.id !== profile.id && (
                          <button
                            onClick={() => addToMyFoods(food)}
                            disabled={addedFoods.has(food.name) || addingFood === food.id}
                            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                              addedFoods.has(food.name)
                                ? 'bg-[#319141]/10 text-[#319141] cursor-default'
                                : 'bg-[#319141] text-white hover:bg-[#0F1E0F]'
                            }`}
                          >
                            {addingFood === food.id ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Adding...
                              </>
                            ) : addedFoods.has(food.name) ? (
                              <>
                                <FaCheck className="text-sm" />
                                Added
                              </>
                            ) : (
                              <>
                                <FaPlus className="text-sm" />
                                Add
                              </>
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
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                              >
                                {ingredient}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Recipe</h4>
                          <div className="space-y-2">
                            {(() => {
                              try {
                                let steps: string[] = [];
                                
                                if (Array.isArray(food.recipe)) {
                                  steps = food.recipe;
                                } else if (typeof food.recipe === 'string') {
                                  // Try to parse if it's a JSON string
                                  if (food.recipe.startsWith('[') && food.recipe.endsWith(']')) {
                                    steps = JSON.parse(food.recipe);
                                  } else {
                                    // Split by newlines or periods
                                    steps = food.recipe
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
                                    // Remove any leading quotes or special characters
                                    cleanedStep = cleanedStep.replace(/^["'`]|["'`]$/g, '');
                                    // Remove backslashes
                                    cleanedStep = cleanedStep.replace(/\\/g, '');
                                    // Remove any "Step X:" prefixes
                                    cleanedStep = cleanedStep.replace(/^(Step\s*\d+:?\s*)/i, '');
                                    // Trim whitespace
                                    cleanedStep = cleanedStep.trim();
                                  }
                                  
                                  return (
                                    <div key={idx} className="flex items-start gap-3">
                                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-medium">
                                        {idx + 1}
                                      </div>
                                      <p className="text-gray-600 text-sm flex-1 pt-1">{cleanedStep}</p>
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