'use client';

import { supabase } from './supabase';

export type DatabaseCheckResult = {
  tablesExist: {
    favorite_foods: boolean;
    meal_plans: boolean;
  };
  errors: string[];
  success: boolean;
};

/**
 * Checks if the required database tables exist in Supabase
 * @returns Promise<DatabaseCheckResult> with information about table existence and any errors
 */
export async function checkDatabaseSetup(): Promise<DatabaseCheckResult> {
  const result: DatabaseCheckResult = {
    tablesExist: {
      favorite_foods: false,
      meal_plans: false,
    },
    errors: [],
    success: false,
  };

  try {
    // Check if favorite_foods table exists
    const { error: favoriteFoodsError } = await supabase
      .from('favorite_foods')
      .select('id')
      .limit(1);

    if (favoriteFoodsError) {
      if (favoriteFoodsError.code === '42P01') {
        // Table doesn't exist
        result.errors.push('Table "favorite_foods" does not exist. Please run the setup SQL script.');
      } else {
        result.errors.push(`Error checking favorite_foods table: ${favoriteFoodsError.message}`);
      }
    } else {
      result.tablesExist.favorite_foods = true;
    }

    // Check if meal_plans table exists
    const { error: mealPlansError } = await supabase
      .from('meal_plans')
      .select('id')
      .limit(1);

    if (mealPlansError) {
      if (mealPlansError.code === '42P01') {
        // Table doesn't exist
        result.errors.push('Table "meal_plans" does not exist. Please run the setup SQL script.');
      } else {
        result.errors.push(`Error checking meal_plans table: ${mealPlansError.message}`);
      }
    } else {
      result.tablesExist.meal_plans = true;
    }

    // Check if we can insert a test record (to test RLS policies)
    if (result.tablesExist.favorite_foods) {
      const testUserId = 'test-user-id';
      const { error: insertError } = await supabase
        .from('favorite_foods')
        .insert({
          user_id: testUserId,
          name: 'TEST_RECORD_DELETE_ME',
          ingredients: 'Test ingredients',
        })
        .select();

      if (insertError) {
        if (insertError.code === '42501' || insertError.message.includes('permission')) {
          result.errors.push('RLS policies may not be set up correctly. Users need insert permissions.');
        } else if (insertError.code === '23503') {
          // This is expected - foreign key constraint error because test user doesn't exist
          // This actually confirms the table structure is correct
        } else {
          result.errors.push(`Error testing insert: ${insertError.message}`);
        }
      } else {
        // Clean up test record if it was inserted
        await supabase
          .from('favorite_foods')
          .delete()
          .eq('user_id', testUserId)
          .eq('name', 'TEST_RECORD_DELETE_ME');
      }
    }

    result.success = result.tablesExist.favorite_foods && 
                     result.tablesExist.meal_plans && 
                     result.errors.length === 0;
    
    return result;
  } catch (err: any) {
    result.errors.push(`Unexpected error checking database: ${err.message}`);
    return result;
  }
} 