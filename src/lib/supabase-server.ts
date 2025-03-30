import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false, // Don't persist the session on server-side
    }
  }
); 