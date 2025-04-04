import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
    
    // Create a success URL with a query parameter to show a success message
    return NextResponse.redirect(new URL(`/dashboard?emailConfirmed=true`, request.url));
  }

  // If there's no code, something went wrong
  return NextResponse.redirect(new URL('/login?error=callback_error', request.url));
} 