'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { FaSpinner, FaPlus, FaCheck } from 'react-icons/fa';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface FavoriteFood {
  id: string;
  name: string;
  ingredients: string[];
  recipe: string;
  user_id: string;
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <FaSpinner className="animate-spin text-3xl text-accent mx-auto mb-4" />
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Profile not found'}</p>
          <Link href="/dashboard" className="text-accent hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
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
          <div className="flex items-center gap-4 mb-6">
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
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Favorite Meals</h2>
          {favoriteFoods.length === 0 ? (
            <p className="text-text-secondary">No favorite meals yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoriteFoods.map((food) => (
                <div key={food.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-primary">{food.name}</h3>
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
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-text-secondary mb-1">Ingredients:</h4>
                    <ul className="list-disc list-inside text-sm text-text-secondary">
                      {food.ingredients.map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-secondary mb-1">Recipe:</h4>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{food.recipe}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 