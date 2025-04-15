import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This route handles the callback after OAuth sign-in
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL('/login?error=Authentication failed', requestUrl.origin)
      );
    }
    
    // For OAuth users, ensure they have a role assigned in their profile and email is confirmed
    if (data && data.session) {
      try {
        // Get user metadata
        const userMetadata = data.session.user.user_metadata || {};
        
        // Check if user has a role, otherwise update profile to ensure role is assigned
        if (!userMetadata.role) {
          // Update user metadata to include role
          await supabase.auth.updateUser({
            data: { role: 'client' }
          });
          
          // Also ensure profile has role set
          await supabase
            .from('profiles')
            .update({ role: 'client' })
            .eq('id', data.session.user.id);
        }
        
        // Ensure email is confirmed via admin API
        await fetch(`${requestUrl.origin}/api/auth/confirm-oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.session.user.id,
          }),
        });
      } catch (profileError) {
        console.error('Error updating user data:', profileError);
        // Continue with the redirect even if updates fail
      }
    }
    
    // Successful authentication, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }
  
  // If no code is present, redirect back to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}