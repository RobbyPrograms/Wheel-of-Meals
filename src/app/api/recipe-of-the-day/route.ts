import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get today's date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch today's recipe from Supabase
    const { data, error } = await supabase
      .from('daily_recipes')
      .select('recipe_data')
      .eq('date', today.toISOString())
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No recipe available for today' },
        { status: 404 }
      );
    }

    return NextResponse.json(data.recipe_data);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
} 