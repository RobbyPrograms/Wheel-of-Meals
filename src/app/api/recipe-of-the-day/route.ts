import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get today's date in UTC and format it as YYYY-MM-DD
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const formattedDate = today.toISOString().split('T')[0];

    console.log('Fetching recipe for date:', formattedDate);

    // Fetch today's recipe from Supabase
    const { data, error } = await supabase
      .from('daily_recipes')
      .select('recipe_data')
      .eq('date', formattedDate)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!data) {
      console.log('No recipe found for date:', formattedDate);
      // Try to get the most recent recipe instead
      const { data: latestData, error: latestError } = await supabase
        .from('daily_recipes')
        .select('recipe_data')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('Error fetching latest recipe:', latestError);
        throw latestError;
      }

      if (!latestData) {
        return NextResponse.json(
          { error: 'No recipe available' },
          { status: 404 }
        );
      }

      return NextResponse.json(latestData.recipe_data);
    }

    return NextResponse.json(data.recipe_data);
  } catch (error) {
    console.error('Error in recipe-of-the-day route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
} 