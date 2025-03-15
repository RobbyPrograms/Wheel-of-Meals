'use client';

import { supabase } from './supabase';
import { checkDatabaseSetup } from './check-database';

/**
 * Automatically sets up the database tables for a user if they don't exist
 * @returns Promise<boolean> indicating if setup was successful
 */
export async function autoSetupDatabase(): Promise<boolean> {
  try {
    // First check if the database is already set up
    const checkResult = await checkDatabaseSetup();
    
    // If database is already set up, no need to do anything
    if (checkResult.success) {
      return true;
    }
    
    // Create favorite_foods table if it doesn't exist
    if (!checkResult.tablesExist.favorite_foods) {
      const { error: createFavoriteFoodsError } = await supabase.rpc('setup_favorite_foods_table');
      if (createFavoriteFoodsError) {
        console.error('Error creating favorite_foods table:', createFavoriteFoodsError);
        return false;
      }
    }
    
    // Create meal_plans table if it doesn't exist
    if (!checkResult.tablesExist.meal_plans) {
      const { error: createMealPlansError } = await supabase.rpc('setup_meal_plans_table');
      if (createMealPlansError) {
        console.error('Error creating meal_plans table:', createMealPlansError);
        return false;
      }
    }
    
    // Verify setup was successful
    const verifyResult = await checkDatabaseSetup();
    return verifyResult.success;
  } catch (error) {
    console.error('Error in autoSetupDatabase:', error);
    return false;
  }
} 