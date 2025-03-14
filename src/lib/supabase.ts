'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type FavoriteFood = {
  id: string;
  user_id: string;
  name: string;
  ingredients: string[];
  created_at: string;
};

export type MealPlan = {
  id: string;
  user_id: string;
  meals: FavoriteFood[];
  duration: 'one_week' | 'two_weeks';
  created_at: string;
}; 