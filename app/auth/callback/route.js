import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This route handles the callback after OAuth sign-in
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL('/login?error=Authentication failed', requestUrl.origin)
      );
    }
    
    // Successful authentication, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }
  
  // If no code is present, redirect back to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}